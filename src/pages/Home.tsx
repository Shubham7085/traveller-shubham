import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../firebase/config'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import AuroraBackground from '../components/AuroraBackground'

interface Trip {
  id: string
  title: string
  location: string
  description: string
}

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen text-white relative">
      <AuroraBackground />

      <div className="max-w-5xl mx-auto px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400 tracking-[0.3em] text-xs font-semibold mb-3">INDIA PORTFOLIO</p>
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
            Travel With Shubham
          </h1>
          <p className="text-slate-400 mt-4 max-w-md mx-auto">
            Har trip ki kahani — photos, memories aur experiences ek jagah.
          </p>
        </motion.div>

        {loading && (
          <p className="text-center text-slate-500">Loading trips...</p>
        )}

        {!loading && trips.length === 0 && (
          <div className="text-center text-slate-500 border border-slate-800 rounded-2xl py-16 bg-slate-900/30 backdrop-blur">
            Abhi koi trip add nahi hui.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          {trips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-500" />
              <div className="relative">
                <h2 className="text-xl font-bold text-cyan-300 mb-1">{trip.title}</h2>
                {trip.location && (
                  <p className="text-xs text-slate-400 tracking-wide uppercase mb-3">📍 {trip.location}</p>
                )}
                <p className="text-slate-300 text-sm leading-relaxed">{trip.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
