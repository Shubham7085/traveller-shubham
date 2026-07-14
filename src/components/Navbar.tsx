import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div
        className={`max-w-6xl mx-auto px-5 flex items-center justify-between rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'bg-slate-950/70 backdrop-blur-xl border border-white/10 py-2.5 px-5 shadow-lg shadow-black/30'
            : ''
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm">
            T
          </div>
          <span className="font-bold tracking-wide text-white text-sm sm:text-base">
            Travel<span className="text-amber-400"> With Shubham</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-8 text-sm text-slate-300">
          <a href="#trips" className="hover:text-amber-400 transition">
            Trips
          </a>
          <a href="#about" className="hover:text-amber-400 transition">
            About
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-white p-2"
          aria-label="Menu"
        >
          <div className="w-5 space-y-1">
            <motion.span
              animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }}
              className="block h-0.5 bg-white rounded"
            />
            <motion.span
              animate={{ opacity: menuOpen ? 0 : 1 }}
              className="block h-0.5 bg-white rounded"
            />
            <motion.span
              animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }}
              className="block h-0.5 bg-white rounded"
            />
          </div>
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="sm:hidden max-w-6xl mx-auto px-5 mt-2"
        >
          <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3 text-sm text-slate-300">
            <a href="#trips" onClick={() => setMenuOpen(false)} className="hover:text-amber-400">
              Trips
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)} className="hover:text-amber-400">
              About
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
