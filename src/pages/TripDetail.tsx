import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import AuroraBackground from '../components/AuroraBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
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
      <div className="min-h-screen bg-[#05070f] text-white flex items-center justify-center">
        Loading...
      </div>
    )

  if (!trip)
    return (
      <div className="min-h-screen bg-[#05070f] text-white flex flex-col items-center justify-center gap-4">
        <p>Trip nahi mili.</p>
        <Link to="/" className="text-amber-400 underline">
          Home pe wapas jao
        </Link>
      </div>
    )

  return (
    <div className="min-h-screen text-white relative">
      <AuroraBackground />
      <Navbar />

      <div className="relative h-[55vh] mt-0">
        {trip.coverImage && (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={trip.coverImage}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-5 pb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">{trip.title}</h1>
          <p className="text-slate-300 text-sm">
            📍 {trip.location}
            {trip.state && `, ${trip.state}`} {trip.duration && `· ${trip.duration}`}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-10">
        <Link to="/" className="text-sm text-amber-400 mb-8 inline-block">
          ← Back to trips
        </Link>

        {trip.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {trip.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wide bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-full px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-slate-300 leading-relaxed mb-12 text-lg">{trip.description}</p>

        {trip.photos?.length > 0 && (
          <>
            <p className="text-amber-400 text-xs tracking-[0.3em] font-semibold mb-3">GALLERY</p>
            <h2 className="text-2xl font-bold mb-5">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-14">
              {trip.photos.map((photo) => (
                <motion.button
                  key={photo.fileId}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setLightbox(photo.url)}
                  className="rounded-2xl overflow-hidden border border-white/10"
                >
                  <img src={photo.url} className="w-full h-36 object-cover" />
                </motion.button>
              ))}
            </div>
          </>
        )}

        {trip.videos?.length > 0 && (
          <>
            <p className="text-amber-400 text-xs tracking-[0.3em] font-semibold mb-3">MOMENTS</p>
            <h2 className="text-2xl font-bold mb-5">Videos</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-14">
              {trip.videos.map((video) => (
                <div
                  key={video.fileId}
                  className="rounded-2xl overflow-hidden border border-white/10 aspect-video"
                >
                  <iframe src={video.url} className="w-full h-full" allow="autoplay" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </div>
  )
}
