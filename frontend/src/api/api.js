// API Layer - All requests go through API Gateway
// Uses mock gateway for now, can switch to real gateway later

import { mockGatewayRequest } from './mockGateway'

const USE_MOCK = import.meta.env.VITE_USE_MOCK_GATEWAY !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  if (USE_MOCK) {
    return mockGatewayRequest(path, options)
  }
  
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Request failed')
  }
  
  return response.json()
}

// User API
export const userApi = {
  login: (username, password) => request('/api/user/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  
  register: (name, email, password) => request('/api/user/api/user/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  })
}

// Product API
export const productApi = {
  list: () => request('/api/products/list')
}

// Inventory API
export const inventoryApi = {
  check: (productId, quantity = 1) => request('/api/inventory/check', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  })
}

// Basket API
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

// Order API
export const orderApi = {
  checkout: (userId) => request('/api/order/checkout', {
    method: 'POST',
    body: JSON.stringify({ userId })
  })
}
