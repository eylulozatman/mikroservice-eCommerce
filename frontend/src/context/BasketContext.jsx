import { createContext, useContext, useState, useCallback } from 'react'
import { basketApi } from '../api/api'
import { useAuth } from './AuthContext'

const BasketContext = createContext(null)

export function BasketProvider({ children }) {
  const { userId } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBasket = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await basketApi.list(userId)
    setItems(data.items || [])
    setLoading(false)
  }, [userId])

  const addItem = async (productId, quantity = 1) => {
    if (!userId) return
    await basketApi.add(userId, productId, quantity)
    await fetchBasket()
  }

  const removeItem = async (productId) => {
    if (!userId) return
    await basketApi.remove(userId, productId)
    await fetchBasket()
  }

  const clearBasket = () => setItems([])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <BasketContext.Provider value={{ items, loading, fetchBasket, addItem, removeItem, clearBasket, itemCount }}>
      {children}
    </BasketContext.Provider>
  )
}

export const useBasket = () => useContext(BasketContext)
