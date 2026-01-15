const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../config/logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

/**
 * RabbitMQ Publisher with Publisher Confirms
 * Production-ready with confirmed delivery, reconnection, and DLX support
 */
class RabbitMQPublisher {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.pendingConfirms = new Map();

        // Exchange configuration with DLX
        this.exchanges = {
            'order.events': { type: 'topic', durable: true },
            'order.events.dlx': { type: 'topic', durable: true }, // Dead Letter Exchange
            'stock.events': { type: 'topic', durable: true },
            'payment.events': { type: 'topic', durable: true }
        };
    }

    /**
     * Connect to RabbitMQ with Confirm Channel
     */
    async connect() {
        try {
            logger.info('Connecting to RabbitMQ...', { url: RABBITMQ_URL.replace(/:[^:]*@/, ':***@') });

            this.connection = await amqp.connect(RABBITMQ_URL);

            // Use Confirm Channel for publisher confirms
            this.channel = await this.connection.createConfirmChannel();

            // Declare exchanges
            for (const [exchange, config] of Object.entries(this.exchanges)) {
                await this.channel.assertExchange(exchange, config.type, { durable: config.durable });
            }

            // Declare Dead Letter Queue for undeliverable messages
            await this.channel.assertQueue('order.events.dlq', {
                durable: true,
                arguments: {
                    'x-message-ttl': 604800000 // 7 days
                }
            });
            await this.channel.bindQueue('order.events.dlq', 'order.events.dlx', '#');

            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.info('RabbitMQ connected successfully with publisher confirms');

            // Handle connection events
            this.connection.on('error', (err) => {
                logger.error('RabbitMQ connection error', { error: err.message });
                this.isConnected = false;
                this.reconnect();
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                this.isConnected = false;
                this.reconnect();
            });

            return true;
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ', { error: error.message });
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Reconnect with exponential backoff
     */
    async reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max RabbitMQ reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        logger.info(`Reconnecting to RabbitMQ in ${delay}ms`, { attempt: this.reconnectAttempts });

        setTimeout(async () => {
            await this.connect();
        }, delay);
    }

    /**
     * Publish a message with publisher confirm
     * Returns a Promise that resolves when broker confirms receipt
     * @param {string} exchange - Exchange name
     * @param {string} routingKey - Routing key for topic exchange
     * @param {Object} message - Message payload
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, throws if not
     */
    async publish(exchange, routingKey, message, options = {}) {
        if (!this.isConnected) {
            logger.warn('RabbitMQ not connected, attempting to connect...');
            const connected = await this.connect();

            if (!connected) {
                throw new Error('Cannot publish - RabbitMQ not connected');
            }
        }

        const messageId = uuidv4();
        const timestamp = new Date().toISOString();

        const enrichedMessage = {
            ...message,
            messageId,
            publishedAt: timestamp,
            correlationId: options.correlationId || messageId
        };

        const messageBuffer = Buffer.from(JSON.stringify(enrichedMessage));

        return new Promise((resolve, reject) => {
            const publishOptions = {
                persistent: true,
                contentType: 'application/json',
                messageId,
                timestamp: Date.now(),
                headers: {
                    'x-retry-count': options.retryCount || 0,
                    'x-original-exchange': exchange,
                    'x-original-routing-key': routingKey
                }
            };

            // Use waitForConfirms after publish
            this.channel.publish(exchange, routingKey, messageBuffer, publishOptions, (err) => {
                if (err) {
                    logger.error('Message publish failed', {
                        exchange,
                        routingKey,
                        messageId,
                        error: err.message
                    });
                    reject(err);
                } else {
                    logger.info('Message published and confirmed', {
                        exchange,
                        routingKey,
                        messageId,
                        eventType: message.eventType
                    });
                    resolve(true);
                }
            });
        });
    }

    /**
     * Publish with retry logic
     * @param {string} exchange
     * @param {string} routingKey
     * @param {Object} message
     * @param {number} maxRetries
     */
    async publishWithRetry(exchange, routingKey, message, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await this.publish(exchange, routingKey, message, { retryCount: attempt });
            } catch (error) {
                lastError = error;
                logger.warn(`Publish attempt ${attempt + 1} failed, retrying...`, {
                    exchange,
                    routingKey,
                    error: error.message
                });
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }

        throw lastError;
    }

    /**
     * Publish order.created event
     */
    async publishOrderCreated(order, items, correlationId) {
        return this.publishWithRetry('order.events', 'order.created', {
            eventType: 'order.created',
            payload: {
                orderId: order.id,
                userId: order.userId,
                status: order.status,
                totalAmount: parseFloat(order.totalAmount),
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: parseFloat(item.unitPrice)
                }))
            }
        }, 3);
    }

    /**
     * Publish stock.reserve request
     */
    async publishStockReserveRequest(orderId, items, correlationId) {
        return this.publishWithRetry('stock.events', 'stock.reserve', {
            eventType: 'stock.reserve',
            payload: {
                orderId,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            }
        }, 3);
    }

    /**
     * Publish stock.release request (compensation)
     */
    async publishStockReleaseRequest(orderId, items, reason) {
        return this.publishWithRetry('stock.events', 'stock.release', {
            eventType: 'stock.release',
            payload: {
                orderId,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                reason: reason || 'ORDER_COMPENSATION'
            }
        }, 3);
    }

    /**
     * Publish order.confirmed event
     */
    async publishOrderConfirmed(order, correlationId) {
        return this.publishWithRetry('order.events', 'order.confirmed', {
            eventType: 'order.confirmed',
            payload: {
                orderId: order.id,
                userId: order.userId,
                status: order.status,
                confirmedAt: new Date().toISOString()
            }
        }, 3);
    }

    /**
     * Publish order.failed event
     */
    async publishOrderFailed(order, reason, correlationId) {
        // Get items from order if available
        const items = order.items || [];

        return this.publishWithRetry('order.events', 'order.failed', {
            eventType: 'order.failed',
            order: {
                id: order.id,
                userId: order.userId,
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            },
            payload: {
                orderId: order.id,
                userId: order.userId,
                reason,
                failedAt: new Date().toISOString()
            }
        }, 3);
    }

    /**
     * Close connection gracefully
     */
    async close() {
        try {
            // Wait for pending confirms
            if (this.channel) {
                await this.channel.waitForConfirms();
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            logger.info('RabbitMQ connection closed gracefully');
        } catch (error) {
            logger.error('Error closing RabbitMQ connection', { error: error.message });
        }
    }

    /**
     * Health check
     */
    isHealthy() {
        return this.isConnected;
    }
}

// Singleton instance
const rabbitmqPublisher = new RabbitMQPublisher();

module.exports = rabbitmqPublisher;
