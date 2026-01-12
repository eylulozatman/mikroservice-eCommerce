const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');
const { logger } = require('./config/logger');
const { AppError } = require('./utils/errors');

/**
 * Express Application Configuration
 * Order Service - Port 8004
 * Production-ready with structured logging and proper error handling
 */
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Idempotency-Key', 'X-Correlation-Id']
}));

// Correlation ID middleware
app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('X-Correlation-Id', req.correlationId);
    next();
});

// Request logging with morgan
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim(), { type: 'http' })
        }
    }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request timestamp middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

/**
 * Health Check Endpoint
 * @route GET /health
 */
app.get('/health', async (req, res) => {
    const { sequelize } = require('./config/database');
    const rabbitmqPublisher = require('./messaging/rabbitmqPublisher');

    let dbStatus = 'unknown';
    let mqStatus = 'unknown';

    try {
        await sequelize.authenticate();
        dbStatus = 'connected';
    } catch {
        dbStatus = 'disconnected';
    }

    mqStatus = rabbitmqPublisher.isHealthy() ? 'connected' : 'disconnected';

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'order-service',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        dependencies: {
            database: dbStatus,
            rabbitmq: mqStatus
        }
    });
});

/**
 * Root endpoint
 * @route GET /
 */
app.get('/', (req, res) => {
    res.json({
        service: 'Order Service',
        version: '1.0.0',
        description: 'E-Commerce Order Management with Saga Orchestration',
        endpoints: {
            health: 'GET /health',
            createOrder: 'POST /api/orders',
            getOrder: 'GET /api/orders/:orderId',
            getUserOrders: 'GET /api/orders/user/:userId',
            updateStatus: 'PATCH /api/orders/:orderId/status',
            cancelOrder: 'DELETE /api/orders/:orderId'
        }
    });
});

/**
 * API Routes
 */
app.use('/api', orderRoutes);

/**
 * 404 Handler
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        correlationId: req.correlationId
    });
});

/**
 * Global Error Handler
 * Distinguishes operational errors from programming errors
 */
app.use((err, req, res, next) => {
    // Log the error
    logger.error('Request error', {
        correlationId: req.correlationId,
        path: req.path,
        method: req.method,
        error: err.message,
        stack: err.stack,
        isOperational: err.isOperational
    });

    // Operational errors (expected)
    if (err.isOperational || err instanceof AppError) {
        return res.status(err.statusCode || 400).json({
            success: false,
            error: err.errorCode || 'ERROR',
            message: err.message,
            details: err.details || undefined,
            correlationId: req.correlationId
        });
    }

    // Programming errors (unexpected)
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message,
        correlationId: req.correlationId,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

module.exports = app;
