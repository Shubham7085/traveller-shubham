import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { collection, addDoc, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import AuroraBackground from '../components/AuroraBackground'

interface Trip {
  id: string
  title: string
  location: string
  state: string
  description: string
  coverImage: string
  duration: string
  tags: string[]
  createdAt: string
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [state, setState] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [duration, setDuration] = useState('')
  const [tags, setTags] = useState('')

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

  const resetForm = () => {
    setTitle('')
    setLocation('')
    setState('')
    setDescription('')
    setCoverImage('')
    setDuration('')
    setTags('')
  }

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await addDoc(collection(db, 'trips'), {
        title: title.trim(),
        location: location.trim(),
        state: state.trim(),
        description: description.trim(),
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        duration: duration.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      })
      resetForm()
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
    <div className="min-h-screen text-white relative">
      <AuroraBackground />
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-slate-300 border border-slate-700 hover:border-cyan-500/50 rounded-lg px-4 py-1.5 transition"
          >
            Logout
          </button>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddTrip}
          className="rounded-2xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl p-5 space-y-3 mb-10"
        >
          <h2 className="font-semibold text-cyan-300 mb-1">Add New Trip</h2>

          <input
            placeholder="Trip title (e.g. Manali)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
            />
            <input
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
            />
          </div>

          <input
            placeholder="Duration (e.g. 5 days)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
          />

          <input
            placeholder="Cover image URL"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
          />

          <input
            placeholder="Tags (comma separated: mountains, snow, trekking)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-500 transition"
            rows={3}
          />

          <button
            disabled={saving}
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold rounded-xl py-3 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Trip'}
          </button>
          {message && <p className="text-sm text-slate-300">{message}</p>}
        </motion.form>

        <h2 className="font-semibold text-cyan-300 mb-3">Existing Trips ({trips.length})</h2>
        <div className="space-y-3">
          <AnimatePresence>
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur p-4 flex justify-between items-start gap-3"
              >
                <div>
                  <p className="font-semibold">{trip.title}</p>
                  <p className="text-sm text-slate-400">{trip.location} {trip.state && `· ${trip.state}`}</p>
                  {trip.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {trip.tags.map((tag) => (
                        <span key={tag} className="text-[10px] uppercase tracking-wide bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="text-red-400 text-xs border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition shrink-0"
                >
                  Delete
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
            }
