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
        className="bg-slate-900/50 border border-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
          Admin Login
        </h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-800/70 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-800/70 text-white rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold rounded-xl py-2.5 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </motion.form>
    </div>
  )
}
