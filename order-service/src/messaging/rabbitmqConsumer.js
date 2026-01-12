const amqp = require('amqplib');
const { logger } = require('../config/logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

/**
 * RabbitMQ Consumer with DLX support
 * Production-ready with proper acknowledgment and dead letter handling
 */
class RabbitMQConsumer {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.handlers = new Map();

        // Queue configuration with DLX
        this.queues = {
            'order.stock.reserved': {
                exchange: 'stock.events',
                routingKey: 'stock.reserved',
                options: {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': 'order.events.dlx',
                        'x-dead-letter-routing-key': 'dlq.stock.reserved'
                    }
                }
            },
            'order.stock.reservation.failed': {
                exchange: 'stock.events',
                routingKey: 'stock.reservation.failed',
                options: {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': 'order.events.dlx',
                        'x-dead-letter-routing-key': 'dlq.stock.reservation.failed'
                    }
                }
            },
            'order.payment.success': {
                exchange: 'payment.events',
                routingKey: 'payment.success',
                options: {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': 'order.events.dlx',
                        'x-dead-letter-routing-key': 'dlq.payment.success'
                    }
                }
            },
            'order.payment.failed': {
                exchange: 'payment.events',
                routingKey: 'payment.failed',
                options: {
                    durable: true,
                    arguments: {
                        'x-dead-letter-exchange': 'order.events.dlx',
                        'x-dead-letter-routing-key': 'dlq.payment.failed'
                    }
                }
            }
        };
    }

    /**
     * Connect to RabbitMQ
     */
    async connect() {
        try {
            logger.info('RabbitMQ Consumer connecting...');
            this.connection = await amqp.connect(RABBITMQ_URL);
            this.channel = await this.connection.createChannel();

            // Set prefetch to process one message at a time
            await this.channel.prefetch(1);

            // Declare exchanges
            const exchanges = ['stock.events', 'payment.events', 'order.events.dlx'];
            for (const exchange of exchanges) {
                await this.channel.assertExchange(exchange, 'topic', { durable: true });
            }

            // Declare and bind queues
            for (const [queueName, config] of Object.entries(this.queues)) {
                await this.channel.assertQueue(queueName, config.options);
                await this.channel.bindQueue(queueName, config.exchange, config.routingKey);
            }

            this.isConnected = true;
            logger.info('RabbitMQ Consumer connected');

            // Handle connection events
            this.connection.on('error', (err) => {
                logger.error('RabbitMQ Consumer connection error', { error: err.message });
                this.isConnected = false;
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ Consumer connection closed');
                this.isConnected = false;
            });

            return true;
        } catch (error) {
            logger.error('RabbitMQ Consumer connection failed', { error: error.message });
            return false;
        }
    }

    /**
     * Register a message handler
     * @param {string} eventType - Event type to handle
     * @param {Function} handler - Handler function
     */
    registerHandler(eventType, handler) {
        this.handlers.set(eventType, handler);
        logger.info('Registered handler', { eventType });
    }

    /**
     * Start consuming messages from all queues
     */
    async startConsuming() {
        if (!this.isConnected) {
            logger.error('Cannot start consuming - not connected');
            return;
        }

        for (const [queueName, config] of Object.entries(this.queues)) {
            await this.consumeQueue(queueName, config.routingKey);
        }

        logger.info('Started consuming messages from all queues');
    }

    /**
     * Consume messages from a specific queue with proper error handling
     */
    async consumeQueue(queueName, eventType) {
        await this.channel.consume(queueName, async (msg) => {
            if (!msg) return;

            const startTime = Date.now();
            let content;

            try {
                content = JSON.parse(msg.content.toString());
                logger.info('Received message', {
                    queue: queueName,
                    eventType: content.eventType,
                    messageId: content.messageId
                });

                const handler = this.handlers.get(content.eventType) || this.handlers.get(eventType);

                if (handler) {
                    await handler(content);
                    this.channel.ack(msg);
                    logger.info('Message processed successfully', {
                        queue: queueName,
                        eventType: content.eventType,
                        messageId: content.messageId,
                        processingTimeMs: Date.now() - startTime
                    });
                } else {
                    // NO HANDLER - send to DLQ instead of silent ack
                    logger.warn('No handler found for event, sending to DLQ', {
                        eventType: content.eventType,
                        messageId: content.messageId
                    });

                    // Reject and send to DLQ
                    this.channel.nack(msg, false, false);
                }
            } catch (error) {
                logger.error('Error processing message', {
                    queue: queueName,
                    eventType: content?.eventType,
                    messageId: content?.messageId,
                    error: error.message,
                    stack: error.stack
                });

                // Check retry count
                const retryCount = msg.properties.headers?.['x-retry-count'] || 0;

                if (retryCount < 3) {
                    // Requeue with incremented retry count
                    logger.info('Requeuing message for retry', {
                        messageId: content?.messageId,
                        retryCount: retryCount + 1
                    });

                    // Delay before requeue
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    this.channel.nack(msg, false, true);
                } else {
                    // Max retries reached, send to DLQ
                    logger.error('Max retries reached, sending to DLQ', {
                        messageId: content?.messageId,
                        retryCount
                    });
                    this.channel.nack(msg, false, false);
                }
            }
        });
    }

    /**
     * Close connection gracefully
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            logger.info('RabbitMQ Consumer connection closed');
        } catch (error) {
            logger.error('Error closing RabbitMQ Consumer', { error: error.message });
        }
    }
}

// Singleton instance
const rabbitmqConsumer = new RabbitMQConsumer();

module.exports = rabbitmqConsumer;
