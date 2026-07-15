import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { db } from '../firebase/config'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import AuroraBackground from '../components/AuroraBackground'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import AnimatedCounter from '../components/AnimatedCounter'
import SearchBar from '../components/SearchBar'
import GallerySection from '../components/GallerySection'
import { Trip } from '../types'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80'

const FEATURES = [
  { icon: '📸', title: 'Real Experiences', desc: 'Captured with heart' },
  { icon: '🧭', title: 'Curated Journeys', desc: 'Handpicked destinations' },
  { icon: '🎬', title: 'High Quality Media', desc: 'Photos & videos in 4K' },
  { icon: '🌏', title: 'Always Exploring', desc: 'More to come...' },
]

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)))
      setLoading(false)
    }
    load()
  }, [])

  const filteredTrips = useMemo(() => {
    if (!search.trim()) return trips
    const s = search.toLowerCase()
    return trips.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.location?.toLowerCase().includes(s) ||
        t.state?.toLowerCase().includes(s) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(s))
    )
  }, [search, trips])

  const totalPhotos = trips.reduce((sum, t) => sum + (t.photos?.length || 0), 0)
  const totalVideos = trips.reduce((sum, t) => sum + (t.videos?.length || 0), 0)
  const uniqueStates = new Set(trips.map((t) => t.state).filter(Boolean)).size

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <AuroraBackground />
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-end sm:items-center pb-16 sm:pb-0">
        <div className="absolute inset-0 -z-10">
          <img src={HERO_IMAGE} alt="hero" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-[#05070f]/70 to-[#05070f]/30" />
        </div>

        <div className="max-w-5xl mx-auto px-5 w-full">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-amber-400 tracking-[0.35em] text-xs font-semibold mb-4"
          >
            INDIA PORTFOLIO
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-bold leading-[1.05] mb-6"
          >
            Explore The World
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              With Shubham
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-300 text-lg max-w-md mb-8"
          >
            Every place has a story. Let's live it — one journey at a time.
          </motion.p>

          <div className="mb-8">
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#trips"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-semibold px-7 py-3.5 rounded-full transition shadow-lg shadow-amber-500/20"
            >
              Explore Trips
            </a>
            <a
              href="#gallery"
              className="border border-white/20 hover:border-amber-400/50 text-white px-7 py-3.5 rounded-full transition backdrop-blur-sm"
            >
              Watch Journey
            </a>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-xs tracking-widest"
        >
          SCROLL ↓
        </motion.div>
      </section>

      {/* STATS */}
      <section className="max-w-5xl mx-auto px-5 -mt-4 sm:-mt-10 relative z-10 mb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Trips', value: trips.length },
            { label: 'States', value: uniqueStates },
            { label: 'Photos', value: totalPhotos },
            { label: 'Videos', value: totalVideos },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 text-center hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-400/5 transition"
            >
              <p className="text-3xl font-bold text-amber-400">
                <AnimatedCounter target={stat.value} suffix="+" />
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED TRIPS */}
      <section id="trips" className="max-w-5xl mx-auto px-5 mb-20 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-8"
        >
          <div>
            <p className="text-amber-400 text-xs tracking-[0.3em] font-semibold mb-2">FEATURED</p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              {search.trim() ? `Results for "${search}"` : 'Latest Journeys'}
            </h2>
          </div>
        </motion.div>

        {loading && <p className="text-slate-500">Loading trips...</p>}

        {!loading && filteredTrips.length === 0 && (
          <div className="text-center text-slate-500 border border-white/10 rounded-3xl py-20 bg-white/[0.02] backdrop-blur">
            {search.trim() ? 'Koi trip nahi mila.' : 'Abhi koi trip add nahi hui.'}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {filteredTrips.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative"
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggleBookmark(trip.id)
                }}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center text-sm hover:bg-black/60 transition"
              >
                {bookmarked.has(trip.id) ? '❤️' : '🤍'}
              </button>

              <Link
                to={`/trip/${trip.id}`}
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl block"
              >
                <div className="relative h-56 overflow-hidden">
                  {trip.coverImage && (
                    <img
                      src={trip.coverImage}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {trip.duration && (
                    <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wide bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/20">
                      {trip.duration}
                    </span>
                  )}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-xl font-bold">{trip.title}</h3>
                    {trip.location && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        📍 {trip.location}
                        {trip.state && `, ${trip.state}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-slate-300 text-sm leading-relaxed line-clamp-2">
                    {trip.description}
                  </p>
                  {trip.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
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
                  {(trip.photos?.length > 0 || trip.videos?.length > 0) && (
                    <p className="text-[11px] text-slate-500 mt-4 pt-4 border-t border-white/10">
                      {trip.photos?.length || 0} photos · {trip.videos?.length || 0} videos
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* QUOTE BANNER */}
      <section className="max-w-5xl mx-auto px-5 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-white/10 p-10 sm:p-14 text-center"
        >
          <div className="absolute inset-0 -z-10">
            <img
              src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1400&q=80"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold leading-snug max-w-2xl mx-auto">
            "Travel is not just about seeing new places, it's about feeling new emotions."
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center p-4"
            >
              <p className="text-2xl mb-2">{f.icon}</p>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <GallerySection trips={trips} />

      {/* ABOUT */}
      <section id="about" className="max-w-4xl mx-auto px-5 mb-28 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 font-bold text-3xl shrink-0">
            S
          </div>
          <div className="text-center sm:text-left">
            <p className="text-amber-400 text-xs tracking-[0.3em] font-semibold mb-2">ABOUT ME</p>
            <h3 className="text-2xl font-bold mb-3">Hi, I'm Shubham</h3>
            <p className="text-slate-300 leading-relaxed">
              A traveler, dreamer and explorer at heart. I love capturing moments, discovering new
              places across India and sharing every journey with you — one memory at a time.
            </p>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
