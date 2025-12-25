import { AuthProvider } from './context/AuthContext'
import { BasketProvider } from './context/BasketContext'
import AppRouter from './routes/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <BasketProvider>
        <AppRouter />
      </BasketProvider>
    </AuthProvider>
  )
}
