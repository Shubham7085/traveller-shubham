import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Trips', href: '#trips' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'About', href: '#about' },
  ]

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
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
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 font-bold text-sm">
            T
          </div>
          <span className="font-bold tracking-wide text-white text-sm sm:text-base whitespace-nowrap">
            Travel<span className="text-amber-400"> With Shubham</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-7 text-sm text-slate-300">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-amber-400 transition">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-amber-300 font-semibold hover:border-amber-400/40 transition"
            >
              {user ? user.email?.[0].toUpperCase() : '👤'}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
                >
                  <div className="p-2">
                    <a
                      href="#trips"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-amber-300 transition"
                    >
                      🧳 My Trips
                    </a>
                    <a
                      href="#gallery"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-amber-300 transition"
                    >
                      🖼 Gallery
                    </a>
                    <div className="h-px bg-white/10 my-1.5" />
                    {user ? (
                      <>
                        <button
                          onClick={() => {
                            setProfileOpen(false)
                            navigate('/admin')
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-amber-300 hover:bg-amber-400/10 transition"
                        >
                          👑 Admin Dashboard
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false)
                            signOut(auth)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 transition"
                        >
                          🚪 Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          navigate('/login')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-amber-300 transition"
                      >
                        🔑 Admin Login
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden max-w-6xl mx-auto px-5 mt-2 overflow-hidden"
          >
            <div className="bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-3 text-sm text-slate-300">
              {links.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="hover:text-amber-400">
                  {l.label}
                </a>
              ))}
              <div className="h-px bg-white/10" />
              {user ? (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/admin')
                  }}
                  className="text-left text-amber-300"
                >
                  👑 Admin Dashboard
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/login')
                  }}
                  className="text-left"
                >
                  🔑 Admin Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
