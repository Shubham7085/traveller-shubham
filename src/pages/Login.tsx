import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuroraBackground from '../components/AuroraBackground'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch (err: any) {
      setError('Login failed. Email ya password galat hai.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen text-white relative flex items-center justify-center px-4">
      <AuroraBackground />
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLogin}
        className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl shadow-black/40"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 font-bold text-lg mx-auto mb-2">
          T
        </div>
        <h1 className="text-xl font-bold text-center text-white mb-1">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/[0.05] text-white rounded-xl px-4 py-2.5 outline-none border border-white/10 focus:border-amber-400/50 transition"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/[0.05] text-white rounded-xl px-4 py-2.5 outline-none border border-white/10 focus:border-amber-400/50 transition"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-semibold rounded-xl py-2.5 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </motion.form>
    </div>
  )
}
