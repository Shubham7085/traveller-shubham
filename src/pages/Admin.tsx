import { useState, useEffect } from 'react'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { collection, addDoc, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

interface Trip {
  id: string
  title: string
  location: string
  description: string
  createdAt: string
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (!u) navigate('/login')
    })
    return unsub
  }, [navigate])

  const loadTrips = async () => {
    const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)))
  }

  useEffect(() => {
    if (user) loadTrips()
  }, [user])

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await addDoc(collection(db, 'trips'), {
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
      })
      setTitle('')
      setLocation('')
      setDescription('')
      setMessage('Trip added ✅')
      loadTrips()
    } catch (err: any) {
      setMessage('Error: ' + err.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'trips', id))
    loadTrips()
  }

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-cyan-400">Admin Panel</h1>
        <button onClick={() => signOut(auth)} className="text-sm text-slate-400 border border-slate-700 rounded-lg px-3 py-1">
          Logout
        </button>
      </div>

      <form onSubmit={handleAddTrip} className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 space-y-3 mb-8">
        <h2 className="font-semibold text-cyan-300">Add New Trip</h2>
        <input
          placeholder="Trip title (e.g. Manali)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-cyan-500"
          required
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-cyan-500"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none border border-slate-700 focus:border-cyan-500"
          rows={3}
        />
        <button disabled={saving} type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg py-2 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Add Trip'}
        </button>
        {message && <p className="text-sm text-slate-300">{message}</p>}
      </form>

      <h2 className="font-semibold text-cyan-300 mb-3">Existing Trips ({trips.length})</h2>
      <div className="space-y-3">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex justify-between items-start">
            <div>
              <p className="font-semibold">{trip.title}</p>
              <p className="text-sm text-slate-400">{trip.location}</p>
            </div>
            <button onClick={() => handleDelete(trip.id)} className="text-red-400 text-sm border border-red-500/30 rounded-lg px-2 py-1">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
