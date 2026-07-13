import { useEffect, useState } from 'react'
import { auth } from './firebase/config'
import { onAuthStateChanged, User } from 'firebase/auth'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-bold">Travel With Shubham</h1>
      <p className="text-slate-400">Firebase connected ✅</p>
      <p className="text-sm text-slate-500">{user ? `Logged in: ${user.email}` : 'Not logged in'}</p>
    </div>
  )
}

export default App
