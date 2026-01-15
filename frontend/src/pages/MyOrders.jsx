import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { orderApi, productApi } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function MyOrders() {
    const [orders, setOrders] = useState([])
    const [products, setProducts] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { userId } = useAuth()

    useEffect(() => {
        if (userId) {
            initData()
        }
    }, [userId])

    const initData = async () => {
        try {
            // Fetch orders and products in parallel
            const [ordersData, productsData] = await Promise.all([
                orderApi.getUserOrders(userId),
                productApi.list()
            ])

            // Create a lookup map for products: { id: product }
            const productMap = {}
            if (productsData.items) {
                productsData.items.forEach(p => {
                    productMap[p.id] = p
                })
            }
            setProducts(productMap)

            if (ordersData.success) {
                setOrders(ordersData.orders || [])
            }
        } catch (err) {
            console.error("Data fetch error:", err)
            setError('Failed to load order history')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'text-[#36e27b] bg-[#36e27b]/10 border-[#36e27b]/20'
            case 'PAID': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
            case 'REVERSED': return 'text-red-400 bg-red-400/10 border-red-400/20'
            case 'CANCELLED': return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
            case 'PAYMENT_PENDING': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
            default: return 'text-white'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'check_circle'
            case 'REVERSED': return 'cancel'
            case 'PAID': return 'credit_card'
            case 'PAYMENT_PENDING': return 'hourglass_empty'
            default: return 'info'
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#112117]">
            <Header />

            <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                        My Orders
                    </h1>
                    <p className="text-[#9eb7a8] text-lg max-w-2xl">
                        Track your purchases and view order history.
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
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-[#1c2620] rounded-xl border border-[#29382f]">
                        <span className="material-symbols-outlined text-6xl text-[#29382f] mb-4">receipt_long</span>
                        <p className="text-[#9eb7a8] text-lg">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map(order => (
                            <div key={order.id} className="bg-[#1c2620] rounded-xl p-6 border border-[#29382f] hover:border-[#36e27b]/30 transition-colors">
                                {/* Order Header */}
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 border-b border-[#29382f] pb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white font-bold font-mono text-lg">#{order.id}</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {getStatusIcon(order.status)}
                                                </span>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-[#5e7065] text-sm">
                                            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-[#9eb7a8] text-sm">Total Amount</p>
                                        <p className="text-2xl font-bold text-white">${parseFloat(order.totalAmount).toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Order Items (Basket Style) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {order.items?.map((item, idx) => {
                                        const product = products[item.productId]
                                        return (
                                            <div key={idx} className="bg-[#112117]/50 rounded-xl p-4 flex gap-4 border border-[#29382f]/50">
                                                {product?.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-20 h-20 object-cover rounded-lg bg-[#253028]"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-[#253028] rounded-lg flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-2xl text-[#36e27b]">shopping_bag</span>
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-bold truncate">{product?.name || `Product #${item.productId}`}</h3>
                                                    <p className="text-[#9eb7a8] text-sm mb-2">{product?.category || 'General'}</p>
                                                    <div className="flex justify-between items-end">
                                                        <p className="text-[#5e7065] text-sm font-medium">Qty: {item.quantity}</p>
                                                        <p className="text-[#36e27b] font-bold">${parseFloat(item.unitPrice).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
