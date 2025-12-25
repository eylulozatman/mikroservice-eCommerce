// Mock API Gateway - Simulates backend services
// All endpoints will go through API Gateway pattern

const MOCK_DELAY = 300

// In-memory mock database
const mockDB = {
  users: [
    { id: '1', name: 'Test User', email: 'test@test.com', password: '123456' }
  ],
  
  products: [
    { id: '1', title: 'Pro Sound Max', price: 299, description: 'Noise cancelling over-ear headphones with 40h battery.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgQCKJjjlw5ZWElITSaWtRYhasZYZg6viYyjT8iwnq24L07L5BpAzd5JtEv6dNEivi8bmcGygNHjdsmsHeAb_NXRT7UL6PPJr4Nbe7LOHrrdwE7HMgJxIaohLcf_41HyFZJWclzSQD7rj16YhNV0fKckJP3jSWpLbdnh5pkXFaFWoxTGsXLZDeZ8gaJdM03jZt2NrsKyZMufNQ8IiczpYugn1aGZghM4WBCSjT10PWv_Z8dXJof4ooAQ3MrY99lJApbNJFnD6UfA', badge: 'New' },
    { id: '2', title: 'UltraBook Air', price: 1299, description: 'Lightweight, powerful, and ready for anything.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARhCP6DJJysPRP8AQ7bWmyoU60e_Dqysg3uG6deafPmGlCQYS4PmR6RtLCLahPYF_8m9pM9g-hF0AzDJsCNc6e10sVy9Rph702XgixFM_-QuhTLvSVMFYmb__rTAhyckNT5c4ymlxfc2y3Ytf1g2nf8aeVDe3A2wW6V4SPDsm9Ehre5qrW1B8IEURbuBLZa7Ezxt_Xbv_IX-AsQHZzWqZ0axeoWp5xqljGbE-uV4_9R5DYzgKZmAr_yEilhsIM3Pp_yjbVMjiH5Q' },
    { id: '3', title: 'FitTrack Pro', price: 199, description: 'Your personal health companion on your wrist.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3MnJttsmfz78DbHwnXhFjDHzGahzzcmwR4QLenK35qaRn0eZYNzcQa1O_rNILKS9jzExWaRR-1BVSkhW-2MQq6nlXiAK5SmT64AEvn0O2PE_oFWq9ZQNBjfp1hFBYcqp2bSy0t2iVrLItlO4MfkFM8avpCfE_DpQrzN3Z7rCmK39XFJQhstF9iEV8gbGk5s_XRlM0bvCvgoyOySLx6GFKTuc1T6AchV_Agz0x8BvOdyuPLVTBXyVmm5aRtBQ00-_J0B20nM0tww', badge: 'Sale' },
    { id: '4', title: 'Phone X12', price: 899, description: 'The future of mobile computing in your pocket.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfG4Bsw41OlCBqcqIuu04QpN49nyK-yQkiEIGjwc_M-jQKtPy9AA8TOiKItC6eZitpr58NNLvOjrM3ME0Zucwr0I6NGdWmTmWHXMCPHMXM-bRwPNNYakU8b4bv3SjuDnMSObK0O32Tobn1iB-kVSxKavI8nJuE91Zd9v5UN-zQ9jk3w_HbSJIPh-hNN1iPa33GJUA5-E89Xa8juklFkR3BK_EB4cE72GuRgUy2gBE4J0P0YcgqvWVqJo5lTJylxEm2tcjrZjnAKg' },
    { id: '5', title: 'MechKey RGB', price: 149, description: 'Tactile switches for the ultimate typing experience.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2pcutzXaF3sNLnXEhdjSajgvhrMjLW_Pg3ykWSzfwDWMLSG3l21VTz6y-rjzneNjRq4VSw71t6-jNnXWTfDUToNbQXugNEzuIOJiveTnRS0pGlV5Ru3PTFOvQNI7ccQ46c31ByM-UE_Ca9YZqqNPzPU9BJLMTT_m55-mV-xna3E7Z1RwshO2QUn3H2G4U3JXye9QLIB8e9nvso3vLi-KtWVnEICUuuwpDndJa9okAG8NrCUgCL8pheW0BMql7PtU2lWMV6H1xMw' },
    { id: '6', title: 'Lumina Bulb', price: 35, description: 'Smart lighting you can control from anywhere.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDEBIZeUeE3k-HnxbBJm0jaAAPn_GTe0xrvWXXOrdXV3juR0X8mxfEUU5CTnyBX0sdtGdr45BmIIHGhu_xljVbeWHwzAGM1enUN6gffnIPNuL4vfvUFqWv2CL7hfJRoexfPsgr0vwXA8PMM8y6ezPBjmjSOwM8ndUygvN8luld5-oyPFapBy_k7oPa4LIBsDOVwQu9uHAM4b8VXmpTkASF5YqEflsNmE0Fsz_XfKwhCaCsJOCmh58d_O5xvKX-wklKcJsLA9KU5A' },
  ],
  
  inventory: {
    '1': 10, '2': 5, '3': 0, '4': 8, '5': 15, '6': 20
  },
  
  baskets: {} // userId -> [{productId, quantity}]
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Route handler for mock gateway
export async function mockGatewayRequest(path, options = {}) {
  await delay(MOCK_DELAY)
  
  const { method = 'GET', body } = options
  const data = body ? JSON.parse(body) : {}
  
  // User endpoints
  if (path === '/api/user/login' && method === 'POST') {
    const user = mockDB.users.find(u => u.email === data.email && u.password === data.password)
    if (user) return { userId: user.id, name: user.name }
    throw new Error('Invalid credentials')
  }
  
  if (path === '/api/user/register' && method === 'POST') {
    const exists = mockDB.users.find(u => u.email === data.email)
    if (exists) throw new Error('Email already exists')
    const newUser = { id: String(mockDB.users.length + 1), ...data }
    mockDB.users.push(newUser)
    return { userId: newUser.id }
  }
  
  // Product endpoints
  if (path === '/api/products/list') {
    return { products: mockDB.products }
  }
  
  // Inventory endpoints
  if (path === '/api/inventory/check' && method === 'POST') {
    const stock = mockDB.inventory[data.productId] || 0
    return { available: stock >= (data.quantity || 1), stock }
  }
  
  // Basket endpoints
  if (path === '/api/basket/list' && method === 'POST') {
    const basket = mockDB.baskets[data.userId] || []
    const items = basket.map(item => {
      const product = mockDB.products.find(p => p.id === item.productId)
      return { ...item, product }
    })
    return { items }
  }
  
  if (path === '/api/basket/add' && method === 'POST') {
    if (!mockDB.baskets[data.userId]) mockDB.baskets[data.userId] = []
    const basket = mockDB.baskets[data.userId]
    const existing = basket.find(i => i.productId === data.productId)
    if (existing) {
      existing.quantity += data.quantity || 1
    } else {
      basket.push({ productId: data.productId, quantity: data.quantity || 1 })
    }
    return { success: true }
  }
  
  if (path === '/api/basket/remove' && method === 'POST') {
    if (!mockDB.baskets[data.userId]) return { success: true }
    mockDB.baskets[data.userId] = mockDB.baskets[data.userId].filter(i => i.productId !== data.productId)
    return { success: true }
  }
  
  // Order endpoints
  if (path === '/api/order/checkout' && method === 'POST') {
    const basket = mockDB.baskets[data.userId] || []
    if (basket.length === 0) throw new Error('Basket is empty')
    
    // Decrease inventory
    basket.forEach(item => {
      if (mockDB.inventory[item.productId]) {
        mockDB.inventory[item.productId] -= item.quantity
      }
    })
    
    // Clear basket
    mockDB.baskets[data.userId] = []
    return { success: true, orderId: 'ORD-' + Date.now() }
  }
  
  throw new Error('Unknown endpoint: ' + path)
}
