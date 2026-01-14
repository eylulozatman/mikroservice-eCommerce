// API Layer - All requests go through API Gateway
// API Gateway: http://localhost:8000

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Idempotency Key için basit UUID oluşturucu, order fonksiyonlarının çalışması için
// (Tarayıcı desteği varsa crypto.randomUUID kullanılır, yoksa fallback çalışır)
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  list: () => request('/api/products')
}

// Inventory API - /api/inventory -> inventory-service:3003
export const inventoryApi = {
  check: (productId, quantity = 1) => request('/api/inventory/check', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  })
}

// Basket API - /api/basket -> basket-service:3002
// Controller endpoints: GET /{userId}, POST /{userId}/add, DELETE /{userId}/item/{itemId}, DELETE /{userId}/clear
export const basketApi = {
  // GET /api/basket/{userId} - Kullanıcının sepetini getir
  get: (userId) => request(`/api/basket/${userId}`),

  // POST /api/basket/{userId}/add - Sepete ürün ekle
  add: (userId, productId, productName, price, imageUrl, quantity = 1) => request(`/api/basket/${userId}/add`, {
    method: 'POST',
    body: JSON.stringify({ productId, productName, price, imageUrl, quantity })
  }),

  // DELETE /api/basket/{userId}/item/{itemId} - Sepetten ürün çıkar
  remove: (userId, itemId) => request(`/api/basket/${userId}/item/${itemId}`, {
    method: 'DELETE'
  }),

  // DELETE /api/basket/{userId}/clear - Sepeti temizle
  clear: (userId) => request(`/api/basket/${userId}/clear`, {
    method: 'DELETE'
  })
}

// Order API - /api/orders -> order-service:3004
export const orderApi = {
  // Sipariş Oluşturma
  create: (orderData, token) => {
    // Backend Idempotency-Key header'ı zorunlu tutuyor
    const idempotencyKey = generateUUID();

    return request('/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(orderData)
    })
  },

  // Kullanıcının Siparişlerini Getirme
  getUserOrders: (userId, token) => request(`/api/orders/user/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }),

  // Tekil Sipariş Detayı
  getOrder: (orderId, token) => request(`/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}
