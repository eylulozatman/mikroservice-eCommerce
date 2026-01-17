const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { logger } = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication Middleware
 * Validates JWT token and attaches user to request
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Allow requests without auth if SKIP_AUTH is explicitly set
            if (process.env.SKIP_AUTH === 'true') {
                logger.warn('Skipping authentication (SKIP_AUTH=true)', {
                    path: req.path,
                    method: req.method
                });
                // Get userId from body, params, or query - in that order
                const userId = req.body?.userId || req.params?.userId || req.query?.userId || 1;
                req.user = { id: parseInt(userId), role: 'user' };
                return next();
            }
            throw new UnauthorizedError('No authentication token provided');
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            req.correlationId = req.headers['x-correlation-id'] || decoded.sub || Date.now().toString();
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token has expired');
            }
            throw new UnauthorizedError('Invalid authentication token');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Authorization Middleware Factory
 * Checks if user has required role
 * @param {string[]} allowedRoles - Roles that can access the resource
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('User not authenticated'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn('Authorization failed', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path
            });
            return next(new ForbiddenError('Insufficient permissions'));
        }

        next();
    };
};

/**
 * User ownership check middleware
 * Ensures user can only access their own resources
 */
const checkOwnership = (req, res, next) => {
    const requestedUserId = parseInt(req.params.userId || req.body.userId);
    const authenticatedUserId = req.user?.id;

    // Admins can access any resource
    if (req.user?.role === 'admin') {
        return next();
    }

    if (requestedUserId && requestedUserId !== authenticatedUserId) {
        logger.warn('Ownership check failed', {
            authenticatedUserId,
            requestedUserId,
            path: req.path
        });
        return next(new ForbiddenError('Cannot access resources of other users'));
    }

    next();
};

module.exports = {
    authenticate,
    authorize,
    checkOwnership
};
