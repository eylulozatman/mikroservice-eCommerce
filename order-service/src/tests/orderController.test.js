const request = require('supertest');
const app = require('../app');

// Mock the models to avoid database connection
jest.mock('../models', () => ({
    Order: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        findAndCountAll: jest.fn(),
        create: jest.fn()
    },
    OrderItem: {
        create: jest.fn()
    },
    SagaState: {
        create: jest.fn()
    },
    ORDER_STATUS: {
        PENDING: 'PENDING',
        STOCK_RESERVED: 'STOCK_RESERVED',
        PAYMENT_PENDING: 'PAYMENT_PENDING',
        PAID: 'PAID',
        CONFIRMED: 'CONFIRMED',
        PROCESSING: 'PROCESSING',
        SHIPPED: 'SHIPPED',
        DELIVERED: 'DELIVERED',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED',
        REVERSED: 'REVERSED'
    },
    SAGA_STEP_STATUS: {
        PENDING: 'PENDING',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED'
    }
}));

// Mock saga orchestrator
jest.mock('../saga/SagaOrchestrator', () => ({
    sagaOrchestrator: {
        executeSaga: jest.fn()
    },
    SAGA_STEPS: {}
}));

// Mock messaging
jest.mock('../messaging/rabbitmqPublisher', () => ({
    connect: jest.fn().mockResolvedValue(true),
    publish: jest.fn().mockResolvedValue(true),
    isHealthy: jest.fn().mockReturnValue(true)
}));

describe('Order Controller API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(503); // DB not connected in test
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('service', 'order-service');
            expect(res.body).toHaveProperty('dependencies');
        });
    });

    describe('GET /', () => {
        it('should return service info', async () => {
            const res = await request(app).get('/');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('service', 'Order Service');
            expect(res.body).toHaveProperty('endpoints');
        });
    });

    describe('POST /api/orders', () => {
        it('should require Idempotency-Key header', async () => {
            const res = await request(app)
                .post('/api/orders')
                .send({ userId: 1, items: [] });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('MISSING_IDEMPOTENCY_KEY');
        });

        it('should validate Idempotency-Key format', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Idempotency-Key', 'short')
                .send({ userId: 1, items: [] });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('INVALID_IDEMPOTENCY_KEY');
        });

        it('should require userId in body', async () => {
            const { sagaOrchestrator } = require('../saga/SagaOrchestrator');

            const res = await request(app)
                .post('/api/orders')
                .set('Idempotency-Key', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
                .send({ items: [{ productId: 1, quantity: 1 }] });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('VALIDATION_ERROR');
            expect(res.body.message).toContain('userId');
        });

        it('should require items array in body', async () => {
            const { sagaOrchestrator } = require('../saga/SagaOrchestrator');

            const res = await request(app)
                .post('/api/orders')
                .set('Idempotency-Key', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
                .send({ userId: 1 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('VALIDATION_ERROR');
            expect(res.body.message).toContain('items');
        });

        it('should create order successfully', async () => {
            const { Order } = require('../models');
            const { sagaOrchestrator } = require('../saga/SagaOrchestrator');

            // Mock no existing order
            Order.findOne.mockResolvedValue(null);

            // Mock successful saga execution
            sagaOrchestrator.executeSaga.mockResolvedValue({
                success: true,
                order: {
                    id: 'order-123',
                    userId: 1,
                    status: 'PENDING',
                    totalAmount: 99.99,
                    items: [],
                    shippingAddress: {},
                    statusHistory: [],
                    created_at: new Date(),
                    updated_at: new Date()
                },
                sagaId: 'saga-123'
            });

            const res = await request(app)
                .post('/api/orders')
                .set('Idempotency-Key', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
                .send({
                    userId: 1,
                    items: [{ productId: 101, quantity: 2, unitPrice: 49.99 }],
                    shippingAddress: { city: 'Istanbul' },
                    paymentDetails: { method: 'credit_card' }
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('order');
        });

        it('should return existing order for duplicate idempotency key', async () => {
            const { Order } = require('../models');

            const existingOrder = {
                id: 'order-existing',
                userId: 1,
                status: 'PENDING',
                totalAmount: 99.99,
                items: [],
                shippingAddress: {},
                statusHistory: [],
                created_at: new Date(),
                updated_at: new Date()
            };

            Order.findOne.mockResolvedValue(existingOrder);

            const res = await request(app)
                .post('/api/orders')
                .set('Idempotency-Key', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
                .send({
                    userId: 1,
                    items: [{ productId: 101, quantity: 2 }]
                });

            expect(res.status).toBe(200);
            expect(res.body.isIdempotent).toBe(true);
        });
    });

    describe('GET /api/orders/:orderId', () => {
        it('should return 404 for non-existent order', async () => {
            const { Order } = require('../models');
            Order.findByPk.mockResolvedValue(null);

            const res = await request(app).get('/api/orders/non-existent-id');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NOT_FOUND');
        });

        it('should return order by ID', async () => {
            const { Order } = require('../models');

            const mockOrder = {
                id: 'order-123',
                userId: 1,
                status: 'CONFIRMED',
                totalAmount: 199.99,
                items: [],
                sagaState: {
                    currentStep: 'CONFIRM_ORDER',
                    completedSteps: [],
                    compensationRequired: false
                },
                shippingAddress: { city: 'Istanbul' },
                statusHistory: [],
                created_at: new Date(),
                updated_at: new Date()
            };

            Order.findByPk.mockResolvedValue(mockOrder);

            const res = await request(app).get('/api/orders/order-123');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.order.id).toBe('order-123');
        });
    });

    describe('GET /api/orders/user/:userId', () => {
        it('should return user orders with pagination', async () => {
            const { Order } = require('../models');

            Order.findAndCountAll.mockResolvedValue({
                count: 2,
                rows: [
                    {
                        id: 'order-1',
                        userId: 1,
                        status: 'DELIVERED',
                        totalAmount: 99.99,
                        items: [],
                        shippingAddress: {},
                        statusHistory: [],
                        created_at: new Date(),
                        updated_at: new Date()
                    },
                    {
                        id: 'order-2',
                        userId: 1,
                        status: 'PROCESSING',
                        totalAmount: 149.99,
                        items: [],
                        shippingAddress: {},
                        statusHistory: [],
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                ]
            });

            const res = await request(app).get('/api/orders/user/1?page=1&limit=10');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.orders).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/unknown/route');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NOT_FOUND');
        });
    });
});
