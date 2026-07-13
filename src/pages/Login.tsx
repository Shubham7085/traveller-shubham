import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch (err: any) {
      setError('Login failed. Email ya password galat hai.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="bg-slate-900/60 border border-cyan-500/20 backdrop-blur rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-cyan-400 text-center">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 outline-none border border-slate-700 focus:border-cyan-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 outline-none border border-slate-700 focus:border-cyan-500"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg py-2 transition">
          Login
        </button>
      </form>
    </div>
  )
}
