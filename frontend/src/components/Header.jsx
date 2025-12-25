import { Link } from 'react-router-dom'
import { useBasket } from '../context/BasketContext'

export default function Header() {
  const { itemCount } = useBasket()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#29382f] bg-[#112117]/80 backdrop-blur-md">
      <div className="px-4 md:px-10 py-3 max-w-[1440px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 text-white">
          <div className="text-[#36e27b]">
            <span className="material-symbols-outlined text-4xl">hexagon</span>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-tight">MicroStore</h2>
        </Link>

        <div className="flex flex-1 justify-end gap-6 items-center">
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#36e27b] text-sm font-bold">Home</Link>
          </nav>

          <Link 
            to="/basket" 
            className="relative flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors group"
          >
            <span className="material-symbols-outlined text-white group-hover:text-[#36e27b] transition-colors">
              shopping_cart
            </span>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#36e27b] text-[#112117] text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#112117]">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
