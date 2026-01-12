/**
 * Custom Application Error Classes
 * Distinguishes operational errors (expected) from programming errors (bugs)
 */

class AppError extends Error {
    constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true; // Distinguishes from programming errors
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 404, 'NOT_FOUND');
        this.resource = resource;
        this.resourceId = id;
    }
}

class ConflictError extends AppError {
    constructor(message, details = null) {
        super(message, 409, 'CONFLICT');
        this.details = details;
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'FORBIDDEN');
    }
}

class ServiceUnavailableError extends AppError {
    constructor(service, message = 'Service temporarily unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE');
        this.service = service;
    }
}

class SagaExecutionError extends AppError {
    constructor(message, step, orderId = null) {
        super(message, 500, 'SAGA_EXECUTION_FAILED');
        this.step = step;
        this.orderId = orderId;
    }
}

class IdempotencyError extends AppError {
    constructor(message) {
        super(message, 400, 'IDEMPOTENCY_ERROR');
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
    ServiceUnavailableError,
    SagaExecutionError,
    IdempotencyError
};
