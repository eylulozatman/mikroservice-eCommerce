const {
    createOrderMachine,
    stateToStatus,
    getOrderStatus,
    getAvailableEvents
} = require('../saga/OrderStateMachine');

// Mock ORDER_STATUS constant
const ORDER_STATUS = {
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
};

describe('OrderStateMachine', () => {
    describe('createOrderMachine', () => {
        it('should create a machine with initial state pending', () => {
            const machine = createOrderMachine({ orderId: 'test-123' });
            machine.start();

            expect(machine.getSnapshot().value).toBe('pending');
            machine.stop();
        });

        it('should accept custom context', () => {
            const context = {
                orderId: 'order-456',
                userId: 1,
                items: [{ productId: 1, quantity: 2 }],
                totalAmount: 199.99
            };

            const machine = createOrderMachine(context);
            machine.start();

            const snapshot = machine.getSnapshot();
            expect(snapshot.context.orderId).toBe('order-456');
            expect(snapshot.context.userId).toBe(1);
            expect(snapshot.context.totalAmount).toBe(199.99);

            machine.stop();
        });
    });

    describe('State Transitions', () => {
        let machine;

        beforeEach(() => {
            machine = createOrderMachine({ orderId: 'test-123' });
            machine.start();
        });

        afterEach(() => {
            machine.stop();
        });

        it('should transition from pending to stockReserved on STOCK_CHECK_SUCCESS', () => {
            machine.send({ type: 'STOCK_CHECK_SUCCESS' });
            expect(machine.getSnapshot().value).toBe('stockReserved');
        });

        it('should transition from pending to failed on STOCK_CHECK_FAILED', () => {
            machine.send({ type: 'STOCK_CHECK_FAILED', reason: 'Out of stock' });
            expect(machine.getSnapshot().value).toBe('failed');
        });

        it('should transition through full happy path', () => {
            machine.send({ type: 'STOCK_CHECK_SUCCESS' });
            expect(machine.getSnapshot().value).toBe('stockReserved');

            machine.send({ type: 'PAYMENT_INITIATED' });
            expect(machine.getSnapshot().value).toBe('paymentPending');

            machine.send({ type: 'PAYMENT_SUCCESS' });
            expect(machine.getSnapshot().value).toBe('paid');

            machine.send({ type: 'CONFIRM' });
            expect(machine.getSnapshot().value).toBe('confirmed');

            machine.send({ type: 'START_PROCESSING' });
            expect(machine.getSnapshot().value).toBe('processing');

            machine.send({ type: 'SHIP' });
            expect(machine.getSnapshot().value).toBe('shipped');

            machine.send({ type: 'DELIVER' });
            expect(machine.getSnapshot().value).toBe('delivered');
        });

        it('should handle cancellation from pending', () => {
            machine.send({ type: 'CANCEL', initiator: 'user' });
            expect(machine.getSnapshot().value).toBe('cancelled');
        });

        it('should handle cancellation from stockReserved', () => {
            machine.send({ type: 'STOCK_CHECK_SUCCESS' });
            machine.send({ type: 'CANCEL', initiator: 'user' });
            expect(machine.getSnapshot().value).toBe('cancelled');
        });

        it('should handle compensation flow', () => {
            machine.send({ type: 'STOCK_CHECK_FAILED', reason: 'Out of stock' });
            expect(machine.getSnapshot().value).toBe('failed');

            machine.send({ type: 'COMPENSATION_COMPLETE' });
            expect(machine.getSnapshot().value).toBe('reversed');
        });
    });

    describe('stateToStatus mapping', () => {
        it('should map all states to ORDER_STATUS', () => {
            expect(stateToStatus.pending).toBe(ORDER_STATUS.PENDING);
            expect(stateToStatus.stockReserved).toBe(ORDER_STATUS.STOCK_RESERVED);
            expect(stateToStatus.paymentPending).toBe(ORDER_STATUS.PAYMENT_PENDING);
            expect(stateToStatus.paid).toBe(ORDER_STATUS.PAID);
            expect(stateToStatus.confirmed).toBe(ORDER_STATUS.CONFIRMED);
            expect(stateToStatus.processing).toBe(ORDER_STATUS.PROCESSING);
            expect(stateToStatus.shipped).toBe(ORDER_STATUS.SHIPPED);
            expect(stateToStatus.delivered).toBe(ORDER_STATUS.DELIVERED);
            expect(stateToStatus.failed).toBe(ORDER_STATUS.FAILED);
            expect(stateToStatus.cancelled).toBe(ORDER_STATUS.CANCELLED);
            expect(stateToStatus.reversed).toBe(ORDER_STATUS.REVERSED);
        });
    });

    describe('getOrderStatus', () => {
        it('should return correct ORDER_STATUS for state', () => {
            expect(getOrderStatus('pending')).toBe(ORDER_STATUS.PENDING);
            expect(getOrderStatus('confirmed')).toBe(ORDER_STATUS.CONFIRMED);
            expect(getOrderStatus('delivered')).toBe(ORDER_STATUS.DELIVERED);
        });

        it('should return PENDING for unknown state', () => {
            expect(getOrderStatus('unknown')).toBe(ORDER_STATUS.PENDING);
        });
    });

    describe('getAvailableEvents', () => {
        it('should return available events for pending state', () => {
            const events = getAvailableEvents('pending');
            expect(events).toContain('STOCK_CHECK_SUCCESS');
            expect(events).toContain('STOCK_CHECK_FAILED');
            expect(events).toContain('CANCEL');
        });

        it('should return empty array for final states', () => {
            expect(getAvailableEvents('delivered')).toEqual([]);
            expect(getAvailableEvents('reversed')).toEqual([]);
        });

        it('should return empty array for unknown states', () => {
            expect(getAvailableEvents('unknown')).toEqual([]);
        });
    });
});
