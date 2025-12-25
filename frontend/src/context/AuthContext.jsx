import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'))
  const [userName, setUserName] = useState(() => localStorage.getItem('userName'))

  const login = (id, name) => {
    localStorage.setItem('userId', id)
    localStorage.setItem('userName', name || '')
    setUserId(id)
    setUserName(name || '')
  }

  const logout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    setUserId(null)
    setUserName(null)
  }

  return (
    <AuthContext.Provider value={{ userId, userName, login, logout, isAuthenticated: !!userId }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
