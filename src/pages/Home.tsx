import { useEffect, useState } from 'react'
import { db } from '../firebase/config'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

interface Trip {
  id: string
  title: string
  location: string
  description: string
}

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)))
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <h1 className="text-3xl font-bold text-cyan-400 text-center mb-8">Travel With Shubham</h1>
      {trips.length === 0 && <p className="text-center text-slate-500">Abhi koi trip add nahi hui.</p>}
      <div className="space-y-4 max-w-2xl mx-auto">
        {trips.map((trip) => (
          <div key={trip.id} className="bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4">
            <h2 className="text-lg font-semibold text-cyan-300">{trip.title}</h2>
            <p className="text-sm text-slate-400">{trip.location}</p>
            <p className="text-slate-300 mt-2">{trip.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
