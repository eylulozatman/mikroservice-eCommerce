import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api/api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !name || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    
    const data = await userApi.register(email, password, name).catch(err => {
      setError(err.message)
      return null
    })
    
    if (data) {
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#112117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-[#36e27b] flex justify-center mb-4">
            <span className="material-symbols-outlined text-6xl">hexagon</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-[#9eb7a8] mt-2">Join MicroStore today</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1c2620] rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[#9eb7a8] text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#112117] border border-[#29382f] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#36e27b] focus:border-transparent outline-none transition-shadow"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[#9eb7a8] text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#112117] border border-[#29382f] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#36e27b] focus:border-transparent outline-none transition-shadow"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-[#9eb7a8] text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#112117] border border-[#29382f] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#36e27b] focus:border-transparent outline-none transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#36e27b] text-[#112117] font-bold rounded-full hover:bg-[#2bc566] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-[#9eb7a8] text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#36e27b] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
