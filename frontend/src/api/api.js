// API Layer - All requests go through API Gateway
// API Gateway: http://localhost:8000

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || error.error || 'Request failed')
  }

  return response.json()
}

// User API - /api/user -> user-service:3000
export const userApi = {
  login: (email, password) => request('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  register: (email, password, name) => request('/api/user/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  })
}

// Product API - /api/products -> product-service:3001
export const productApi = {
  list: () => request('/api/products/list')
}

// Inventory API - /api/inventory -> inventory-service:3003
export const inventoryApi = {
  check: (productId, quantity = 1) => request('/api/inventory/check', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  })
}

// Basket API - /api/basket -> basket-service:3002
export const basketApi = {
  list: (userId) => request('/api/basket/list', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),

  add: (userId, productId, quantity = 1) => request('/api/basket/add', {
    method: 'POST',
    body: JSON.stringify({ userId, productId, quantity })
  }),

  remove: (userId, productId) => request('/api/basket/remove', {
    method: 'POST',
    body: JSON.stringify({ userId, productId })
  })
}

// Order API - /api/orders -> order-service:3004
export const orderApi = {
  checkout: (userId) => request('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({ userId })
  })
}
