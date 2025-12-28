import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')
    
    const data = await userApi.login(username, password).catch(err => {
      setError(err.message)
      return null
    })
    
    if (data) {
      login(data.userId, data.name)
      navigate('/')
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
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-[#9eb7a8] mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1c2620] rounded-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[#9eb7a8] text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#112117] border border-[#29382f] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#36e27b] focus:border-transparent outline-none transition-shadow"
              placeholder="your_username"
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-[#9eb7a8] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#36e27b] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
