import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useBasket } from '../context/BasketContext'
import { useAuth } from '../context/AuthContext'
import { orderApi, inventoryApi } from '../api/api'

export default function Basket() {
  const { items, loading, fetchBasket, removeItem, clearBasket } = useBasket()
  const { userId } = useAuth()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBasket()
  }, [])

  const handleRemove = async (itemId) => {
    await removeItem(itemId)
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    if (!userId) {
      alert("Lütfen sipariş vermek için giriş yapın.")
      return
    }

    setCheckoutLoading(true)

    try {
      // 1. Önce tüm ürünler için inventory check yap
      const outOfStockItems = []

      for (const item of items) {
        try {
          const result = await inventoryApi.check(item.productId, item.quantity)
          if (!result.available) {
            outOfStockItems.push({
              name: item.productName,
              requested: item.quantity,
              available: result.currentStock || 0
            })
          }
        } catch (err) {
          console.error(`Inventory check failed for ${item.productName}:`, err)
          // Inventory service erişilemezse devam et (optional)
        }
      }

      // 2. Stokta olmayan ürün varsa hata göster
      if (outOfStockItems.length > 0) {
        const message = outOfStockItems.map(item =>
          `${item.name}: ${item.requested} adet istendi, ${item.available} adet mevcut`
        ).join('\n')
        alert('Yetersiz stok:\n' + message)
        setCheckoutLoading(false)
        return
      }

      // 3. Tüm stoklar uygunsa sipariş oluştur
      const orderPayload = {
        userId: parseInt(userId),
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price || 0)
        })),
        shippingAddress: {
          city: "Istanbul",
          street: "Örnek Cadde No:1",
          zipCode: "34000"
        },
        paymentDetails: {
          method: "credit_card"
        }
      }

      // A. Siparişi Oluştur
      const data = await orderApi.create(orderPayload, null)

      if (data?.success) {
        const orderId = data.order?.id || data.orderId;
        console.log(`Order Created: ${orderId}. Initiating Mock Payment...`);

        try {
          // B. Ödemeyi Tetikle
          const paymentResult = await orderApi.pay(orderId, null);

          if (paymentResult?.success) {
            console.log("Payment Successful!");
            clearBasket()
            alert(`Sipariş ve Ödeme Başarılı!\nSipariş No: ${orderId}`);
            navigate('/')
          }
        } catch (paymentErr) {
          console.error("Payment Failed:", paymentErr);
          alert(`Ödeme Başarısız Oldu!\n\nSipariş iptal edildi ve stoklar geri yüklendi.`);
        }
      }
    } catch (err) {
      console.error("Checkout hatası:", err)
      alert('Sipariş oluşturulurken hata: ' + err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Backend'den gelen format: { id, productId, productName, price, quantity }
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0)

  return (
    <div className="flex flex-col min-h-screen bg-[#112117]">
      <Header />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <h1 className="text-4xl font-black tracking-tighter text-white mb-8">Your Basket</h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined text-4xl text-[#36e27b] animate-spin">
              progress_activity
            </span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-[#29382f] mb-4">shopping_cart</span>
            <p className="text-[#9eb7a8] text-lg">Your basket is empty</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {items.map(item => (
                <div key={item.id} className="bg-[#1c2620] rounded-xl p-4 flex gap-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-lg bg-[#253028]"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-[#253028] rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-[#36e27b]">shopping_bag</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{item.productName}</h3>
                    <p className="text-[#9eb7a8] text-sm">Qty: {item.quantity}</p>
                    <p className="text-[#36e27b] font-bold mt-1">${parseFloat(item.price).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:w-80">
              <div className="bg-[#1c2620] rounded-xl p-6 sticky top-24">
                <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[#9eb7a8]">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#9eb7a8]">
                    <span>Shipping</span>
                    <span className="text-[#36e27b]">Free</span>
                  </div>
                  <hr className="border-[#29382f]" />
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading || items.length === 0}
                  className="w-full h-12 bg-[#36e27b] text-[#112117] font-bold rounded-full hover:bg-[#2bc566] transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'Processing...' : 'Complete Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}