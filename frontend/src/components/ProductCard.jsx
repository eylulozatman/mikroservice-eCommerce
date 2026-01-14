import { useState } from 'react'

export default function ProductCard({ product, onAddToBasket }) {
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    await onAddToBasket(product.id)
    setLoading(false)
  }

  return (
    <div className="group relative flex flex-col bg-[#1c2620] rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#36e27b]/10 transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative w-full pt-[100%] bg-[#253028] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.category && (
          <div className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-[#36e27b] text-[#112117]">
            {product.category}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow p-5 gap-3">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-white text-lg font-bold leading-tight">{product.name}</h3>
            <span className="text-[#36e27b] font-bold text-lg">${product.price}</span>
          </div>
          <p className="text-[#9eb7a8] text-sm leading-relaxed">{product.description}</p>
        </div>

        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full mt-2 h-10 bg-white text-[#112117] font-bold text-sm rounded-full hover:bg-[#36e27b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <span>Add to Cart</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
