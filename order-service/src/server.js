require('dotenv').config();
const app = require('./app');
const { testConnection, syncDatabase } = require('./config/database');
const rabbitmqPublisher = require('./messaging/rabbitmqPublisher');
const rabbitmqConsumer = require('./messaging/rabbitmqConsumer');
const { sagaOrchestrator } = require('./saga/SagaOrchestrator');

const PORT = process.env.PORT || 3004;

/**
 * Register RabbitMQ event handlers
 */
const registerEventHandlers = () => {
    // Handle stock reserved event
    rabbitmqConsumer.registerHandler('stock.reserved', async (message) => {
        console.log('📥 Received stock.reserved event:', message.payload);
        await sagaOrchestrator.handleExternalEvent(
            message.payload.orderId,
            'stock.reserved',
            message.payload
        );
    });

    // Handle stock reservation failed event
    rabbitmqConsumer.registerHandler('stock.reservation.failed', async (message) => {
        console.log('📥 Received stock.reservation.failed event:', message.payload);
        await sagaOrchestrator.handleExternalEvent(
            message.payload.orderId,
            'stock.reservation.failed',
            message.payload
        );
    });

    // Handle payment success event
    rabbitmqConsumer.registerHandler('payment.success', async (message) => {
        console.log('📥 Received payment.success event:', message.payload);
        await sagaOrchestrator.handleExternalEvent(
            message.payload.orderId,
            'payment.success',
            message.payload
        );
    });

    // Handle payment failed event
    rabbitmqConsumer.registerHandler('payment.failed', async (message) => {
        console.log('📥 Received payment.failed event:', message.payload);
        await sagaOrchestrator.handleExternalEvent(
            message.payload.orderId,
            'payment.failed',
            message.payload
        );
    });
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    try {
        await rabbitmqPublisher.close();
        await rabbitmqConsumer.close();
        console.log('✅ Connections closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

/**
 * Start the server
 */
const startServer = async () => {
    console.log('🚀 Starting Order Service...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Database connection failed');
            // Continue anyway in development mode
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }

        // Sync database (create tables if not exist)
        // In production, use migrations instead
        if (process.env.NODE_ENV !== 'production') {
            await syncDatabase(false); // false = don't drop tables
        }

        // Connect to RabbitMQ
        const mqConnected = await rabbitmqPublisher.connect();
        if (!mqConnected) {
            console.warn('⚠️ RabbitMQ publisher connection failed - events will be queued');
        }

        // Start RabbitMQ consumer
        const consumerConnected = await rabbitmqConsumer.connect();
        if (consumerConnected) {
            registerEventHandlers();
            await rabbitmqConsumer.startConsuming();
        } else {
            console.warn('⚠️ RabbitMQ consumer connection failed - event handling disabled');
        }

        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🛒  ORDER SERVICE STARTED SUCCESSFULLY                       ║
║                                                                ║
║   📍 Port: ${PORT}                                               ║
║   🌍 URL: http://localhost:${PORT}                               ║
║   📋 Health: http://localhost:${PORT}/health                     ║
║                                                                ║
║   📚 Endpoints:                                                ║
║      POST   /api/orders              - Create order            ║
║      GET    /api/orders/:id          - Get order               ║
║      GET    /api/orders/user/:userId - Get user orders         ║
║      PATCH  /api/orders/:id/status   - Update status           ║
║      DELETE /api/orders/:id          - Cancel order            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();
