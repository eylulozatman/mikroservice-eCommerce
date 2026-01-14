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
    try {
      const data = await basketApi.get(userId)
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch basket:', error)
      setItems([])
    }
    setLoading(false)
  }, [userId])

  // product: { id, name, price, ... }
  const addItem = async (product, quantity = 1) => {
    if (!userId) {
      console.error('User not logged in')
      return
    }
    try {
      await basketApi.add(userId, product.id, product.name, product.price, product.imageUrl, quantity)
      await fetchBasket()
    } catch (error) {
      console.error('Failed to add item:', error)
      throw error
    }
  }

  const removeItem = async (itemId) => {
    if (!userId) return
    try {
      await basketApi.remove(userId, itemId)
      await fetchBasket()
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const clearBasket = async () => {
    if (!userId) return
    try {
      await basketApi.clear(userId)
      setItems([])
    } catch (error) {
      console.error('Failed to clear basket:', error)
    }
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <BasketContext.Provider value={{ items, loading, fetchBasket, addItem, removeItem, clearBasket, itemCount }}>
      {children}
    </BasketContext.Provider>
  )
}

export const useBasket = () => useContext(BasketContext)
