import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import AuroraBackground from '../components/AuroraBackground'
import { Trip } from '../types'

export default function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const snap = await getDoc(doc(db, 'trips', id))
      if (snap.exists()) {
        setTrip({ id: snap.id, ...snap.data() } as Trip)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    )

  if (!trip)
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <p>Trip nahi mili.</p>
        <Link to="/" className="text-cyan-400 underline">
          Home pe wapas jao
        </Link>
      </div>
    )

  return (
    <div className="min-h-screen text-white relative">
      <AuroraBackground />
      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="text-sm text-cyan-400 mb-6 inline-block">
          ← Back to trips
        </Link>

        {trip.coverImage && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-56 object-cover rounded-2xl mb-6 border border-cyan-500/20"
          />
        )}

        <h1 className="text-3xl font-bold text-cyan-300 mb-1">{trip.title}</h1>
        <p className="text-slate-400 text-sm mb-1">
          📍 {trip.location}
          {trip.state && `, ${trip.state}`} {trip.duration && `· ${trip.duration}`}
        </p>

        {trip.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 my-4">
            {trip.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wide bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-slate-300 leading-relaxed mb-8">{trip.description}</p>

        {trip.photos?.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {trip.photos.map((photo) => (
                <button
                  key={photo.fileId}
                  onClick={() => setLightbox(photo.url)}
                  className="rounded-xl overflow-hidden border border-slate-800"
                >
                  <img src={photo.url} className="w-full h-32 object-cover hover:scale-105 transition" />
                </button>
              ))}
            </div>
          </>
        )}

        {trip.videos?.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-cyan-300 mb-3">Videos</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {trip.videos.map((video) => (
                <div key={video.fileId} className="rounded-xl overflow-hidden border border-slate-800 aspect-video">
                  <iframe src={video.url} className="w-full h-full" allow="autoplay" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
