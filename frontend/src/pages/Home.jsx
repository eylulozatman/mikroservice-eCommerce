import { useEffect, useState } from 'react'
import Header from '../components/Header'
import ProductCard from '../components/ProductCard'
import { productApi, inventoryApi } from '../api/api'
import { useBasket } from '../context/BasketContext'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem, fetchBasket } = useBasket()

  useEffect(() => {
    fetchBasket()
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const data = await productApi.list().catch(err => {
      setError(err.message)
      return { items: [] }
    })
    setProducts(data.items || [])
    setLoading(false)
  }

  // product: full product object including id, name, price, etc.
  const handleAddToBasket = async (product) => {
    try {
      const { available } = await inventoryApi.check(product.id)
      if (!available) {
        alert('Sorry, this product is out of stock')
        return
      }
      await addItem(product)
    } catch (error) {
      console.error('Failed to add to basket:', error)
      alert('Failed to add product to basket')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#112117]">
      <Header />
      
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            New Arrivals
          </h1>
          <p className="text-[#9eb7a8] text-lg max-w-2xl">
            Discover the latest technology engineered for performance and style.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined text-4xl text-[#36e27b] animate-spin">
              progress_activity
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToBasket={handleAddToBasket}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#29382f] bg-[#112117] py-12">
        <div className="px-4 md:px-10 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <div className="text-[#36e27b]">
              <span className="material-symbols-outlined text-3xl">hexagon</span>
            </div>
            <span className="font-bold text-lg">MicroStore</span>
          </div>
          <p className="text-[#5e7065] text-sm">© 2024 MicroStore Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
