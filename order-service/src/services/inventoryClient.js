const axios = require('axios');

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8003';

/**
 * Inventory Service Client
 * Handles synchronous REST calls to the Inventory Service for stock validation
 */
class InventoryClient {
    constructor() {
        this.baseUrl = INVENTORY_SERVICE_URL;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check stock availability for a product
     * Synchronous REST call - blocks until response received
     * @param {number} productId - Product ID to check
     * @param {number} requestedQuantity - Quantity needed
     * @returns {Object} - Stock availability info
     */
    async checkStock(productId, requestedQuantity = 1) {
        try {
            // GET /inventory/{productId}
            const response = await this.client.get(`/inventory/${productId}`);
            const data = response.data;

            // Handle different response formats from Inventory Service
            const availableQuantity = data.quantity ?? data.stock ?? data.available ?? 0;
            const isAvailable = availableQuantity >= requestedQuantity;

            return {
                available: isAvailable,
                quantity: availableQuantity,
                productId: productId,
                productName: data.productName || data.name || null,
                price: data.price || data.unitPrice || null,
                requestedQuantity
            };
        } catch (error) {
            if (error.response) {
                // Inventory service responded with error
                if (error.response.status === 404) {
                    return {
                        available: false,
                        quantity: 0,
                        productId,
                        error: 'PRODUCT_NOT_FOUND'
                    };
                }
                throw new Error(`Inventory service error: ${error.response.status}`);
            }

            // Network error or timeout
            throw new Error(`Inventory service unavailable: ${error.message}`);
        }
    }

    /**
     * Request stock decrease (async fallback - prefer RabbitMQ)
     * @param {number} productId - Product ID
     * @param {number} quantity - Quantity to decrease
     * @returns {Object} - Result
     */
    async decreaseStock(productId, quantity) {
        try {
            const response = await this.client.post('/inventory/decrease', {
                productId,
                quantity
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(`Failed to decrease stock for product ${productId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Request stock increase (for compensation/rollback)
     * @param {number} productId - Product ID
     * @param {number} quantity - Quantity to restore
     * @returns {Object} - Result
     */
    async increaseStock(productId, quantity) {
        try {
            const response = await this.client.post('/inventory/increase', {
                productId,
                quantity
            });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(`Failed to increase stock for product ${productId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check connectivity to Inventory Service
     * @returns {boolean}
     */
    async healthCheck() {
        try {
            await this.client.get('/health', { timeout: 2000 });
            return true;
        } catch {
            return false;
        }
    }
}

// Singleton instance
const inventoryClient = new InventoryClient();

module.exports = inventoryClient;
