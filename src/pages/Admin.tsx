import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { useNavigate, Link } from 'react-router-dom'
import AuroraBackground from '../components/AuroraBackground'
import {
  beginDriveConnect,
  captureTokenFromRedirect,
  isDriveConnected,
  uploadFileToDrive,
  uploadFilesToDrive,
  getConnectedAccounts,
  getAggregateStorage,
  removeAccount,
  formatBytes,
} from '../services/googleDrive'
import { Trip } from '../types'

export default function Admin() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<Trip[]>([])

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [state, setState] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [tags, setTags] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [accountsVersion, setAccountsVersion] = useState(0)
  const [uploadingTripId, setUploadingTripId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<'overview' | 'add' | 'trips' | 'drive' | 'settings'>(
    'overview'
  )

  const [heroImage, setHeroImage] = useState('')
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroSaving, setHeroSaving] = useState(false)
  const [heroMessage, setHeroMessage] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (!u) navigate('/login')
    })
    return unsub
  }, [navigate])

  useEffect(() => {
    captureTokenFromRedirect().then((got) => {
      if (got) setAccountsVersion((v) => v + 1)
    })
  }, [])

  const loadTrips = async () => {
    const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)))
  }

  const loadSettings = async () => {
    const snap = await getDoc(doc(db, 'settings', 'site'))
    if (snap.exists()) {
      setHeroImage(snap.data().heroImage || '')
    }
  }

  useEffect(() => {
    if (user) {
      loadTrips()
      loadSettings()
    }
  }, [user])

  const resetForm = () => {
    setTitle('')
    setLocation('')
    setState('')
    setDescription('')
    setDuration('')
    setTags('')
    setCoverFile(null)
    setEditingTrip(null)
  }

  const startEdit = (trip: Trip) => {
    setEditingTrip(trip)
    setTitle(trip.title)
    setLocation(trip.location || '')
    setState(trip.state || '')
    setDescription(trip.description || '')
    setDuration(trip.duration || '')
    setTags((trip.tags || []).join(', '))
    setCoverFile(null)
    setActiveTab('add')
  }

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      let coverImage =
        editingTrip?.coverImage ||
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
      let coverFileId = editingTrip?.coverFileId || ''

      if (coverFile) {
        if (!isDriveConnected()) {
          setMessage('Cover image upload karne ke liye pehle Drive connect karo')
          setSaving(false)
          return
        }
        const uploaded = await uploadFileToDrive(coverFile)
        coverImage = uploaded.url
        coverFileId = uploaded.fileId
      }

      const payload = {
        title: title.trim(),
        location: location.trim(),
        state: state.trim(),
        description: description.trim(),
        coverImage,
        coverFileId,
        duration: duration.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }

      if (editingTrip) {
        await updateDoc(doc(db, 'trips', editingTrip.id), payload)
        setMessage('Trip update ho gayi ✅')
      } else {
        await addDoc(collection(db, 'trips'), {
          ...payload,
          photos: [],
          videos: [],
          createdAt: new Date().toISOString(),
        })
        setMessage('Trip added ✅')
      }

      resetForm()
      loadTrips()
      setAccountsVersion((v) => v + 1)
      setActiveTab('trips')
    } catch (err: any) {
      setMessage('Error: ' + err.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ye trip delete karna hai? Ye undo nahi hoga.')) return
    await deleteDoc(doc(db, 'trips', id))
    loadTrips()
  }

  const handleMediaUpload = async (trip: Trip, files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!isDriveConnected()) {
      alert('Pehle Drive tab se Google Drive connect karo')
      return
    }
    setUploadingTripId(trip.id)
    setUploadProgress({ done: 0, total: files.length })
    try {
      const uploaded = await uploadFilesToDrive(Array.from(files), 3, (done, total) =>
        setUploadProgress({ done, total })
      )
      const newPhotos = uploaded.filter((u) => u.type === 'image')
      const newVideos = uploaded.filter((u) => u.type === 'video')
      const updates: any = {}
      if (newPhotos.length) updates.photos = arrayUnion(...newPhotos)
      if (newVideos.length) updates.videos = arrayUnion(...newVideos)
      await updateDoc(doc(db, 'trips', trip.id), updates)
      loadTrips()
      setAccountsVersion((v) => v + 1)
    } catch (err: any) {
      alert('Upload me error: ' + err.message)
    }
    setUploadingTripId(null)
    setUploadProgress(null)
  }

  const handleHeroSave = async () => {
    if (!heroFile) return
    if (!isDriveConnected()) {
      setHeroMessage('Pehle Drive tab se Google Drive connect karo')
      return
    }
    setHeroSaving(true)
    setHeroMessage('')
    try {
      const uploaded = await uploadFileToDrive(heroFile)
      await setDoc(doc(db, 'settings', 'site'), { heroImage: uploaded.url }, { merge: true })
      setHeroImage(uploaded.url)
      setHeroFile(null)
      setHeroMessage('Hero image update ho gayi ✅')
      setAccountsVersion((v) => v + 1)
    } catch (err: any) {
      setHeroMessage('Error: ' + err.message)
    }
    setHeroSaving(false)
  }

  const accounts = getConnectedAccounts()
  const aggregate = getAggregateStorage()
  const totalPhotos = trips.reduce((s, t) => s + (t.photos?.length || 0), 0)
  const totalVideos = trips.reduce((s, t) => s + (t.videos?.length || 0), 0)

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    )

  const navItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'trips', label: 'Trips', icon: '🧳' },
    { key: 'add', label: editingTrip ? 'Edit Trip' : 'Add Trip', icon: editingTrip ? '✏️' : '➕' },
    { key: 'drive', label: 'Google Drive', icon: '☁️' },
    { key: 'settings', label: 'Site Settings', icon: '🎨' },
  ] as const

  return (
    <div className="min-h-screen text-white relative flex">
      <AuroraBackground />

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/10 bg-slate-950/40 backdrop-blur-xl min-h-screen p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-sm">
            T
          </div>
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        <Link
          to="/"
          className="text-xs text-cyan-300 hover:text-cyan-200 transition mb-8 inline-flex items-center gap-1"
        >
          🏠 View Live Site
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left ${
                activeTab === item.key
                  ? 'bg-gradient-to-r from-cyan-400/10 to-purple-400/10 text-cyan-300 border border-cyan-400/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <p className="text-xs text-slate-500 truncate mb-2">{user?.email}</p>
          <button
            onClick={() => signOut(auth)}
            className="w-full text-sm text-slate-300 border border-slate-700 hover:border-red-400/50 hover:text-red-300 rounded-lg px-3 py-2 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg" title="View Live Site">
            🏠
          </Link>
          <span className="font-bold text-sm">👑 Admin Panel</span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="text-xs text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5"
        >
          Logout
        </button>
      </div>

      <main className="flex-1 px-5 py-8 md:py-10 max-w-4xl mx-auto w-full mt-14 md:mt-0">
        {/* MOBILE TABS */}
        <div className="md:hidden flex gap-2 overflow-x-auto mb-6 pb-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition ${
                activeTab === item.key
                  ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/30'
                  : 'text-slate-400 border border-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                Overview
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Trips', value: trips.length, color: 'text-cyan-400' },
                  { label: 'Total Photos', value: totalPhotos, color: 'text-purple-400' },
                  { label: 'Total Videos', value: totalVideos, color: 'text-amber-400' },
                  { label: 'Drive Accounts', value: accounts.length, color: 'text-pink-400' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4"
                  >
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 mb-6">
                <p className="text-sm font-semibold text-cyan-300 mb-3">Storage (Google Drive)</p>
                {aggregate.accountCount === 0 ? (
                  <p className="text-sm text-slate-400">
                    Koi drive connected nahi hai.{' '}
                    <button onClick={() => setActiveTab('drive')} className="text-cyan-400 underline">
                      Connect karo
                    </button>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((a) => (
                      <div key={a.email}>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span className="truncate">{a.email}</span>
                          <span>
                            {formatBytes(a.usedBytes)}
                            {a.totalBytes ? ` / ${formatBytes(a.totalBytes)}` : ''}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400"
                            style={{
                              width: a.totalBytes
                                ? `${Math.min(100, (a.usedBytes / a.totalBytes) * 100)}%`
                                : '5%',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
                <p className="text-sm font-semibold text-cyan-300 mb-3">Recent Trips</p>
                {trips.length === 0 ? (
                  <p className="text-sm text-slate-500">Koi trip nahi hai abhi.</p>
                ) : (
                  <div className="space-y-2">
                    {trips.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center gap-3 text-sm">
                        {t.coverImage && (
                          <img src={t.coverImage} className="w-9 h-9 rounded-lg object-cover" />
                        )}
                        <span className="text-slate-300">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setActiveTab('add')}
                  className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 text-slate-950 font-semibold rounded-xl py-3 text-sm"
                >
                  ➕ Add Trip
                </button>
                <button
                  onClick={() => setActiveTab('drive')}
                  className="border border-white/15 rounded-xl py-3 text-sm hover:border-cyan-400/40 transition"
                >
                  ☁️ Manage Drive
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'drive' && (
            <motion.div
              key="drive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                Google Drive
              </h1>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-300">
                      {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
                    </p>
                    <p className="text-xs text-slate-400">Naya account add karne ke liye reconnect karo</p>
                  </div>
                  <button
                    onClick={beginDriveConnect}
                    className="text-sm bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 rounded-lg px-4 py-2 hover:bg-cyan-400/20 transition shrink-0"
                  >
                    {accounts.length === 0 ? 'Connect Drive' : '+ Add Account'}
                  </button>
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {accounts.map((a) => (
                      <div
                        key={a.email}
                        className="flex justify-between items-center text-xs bg-slate-800/50 rounded-lg px-3 py-2.5"
                      >
                        <span className="text-slate-300 truncate">{a.email}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500">
                            {formatBytes(a.usedBytes)}
                            {a.totalBytes ? ` / ${formatBytes(a.totalBytes)}` : ''}
                          </span>
                          <button
                            onClick={() => {
                              removeAccount(a.email)
                              setAccountsVersion((v) => v + 1)
                            }}
                            className="text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {aggregate.accountCount > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Total storage used</span>
                      <span>
                        {formatBytes(aggregate.usedBytes)}
                        {aggregate.totalBytes ? ` / ${formatBytes(aggregate.totalBytes)}` : ''}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400"
                        style={{
                          width: aggregate.totalBytes
                            ? `${Math.min(100, (aggregate.usedBytes / aggregate.totalBytes) * 100)}%`
                            : '5%',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                  {editingTrip ? 'Edit Trip' : 'Add New Trip'}
                </h1>
                {editingTrip && (
                  <button
                    onClick={() => resetForm()}
                    className="text-xs text-slate-400 border border-slate-700 rounded-lg px-3 py-1.5"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form
                onSubmit={handleAddTrip}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3"
              >
                <input
                  placeholder="Trip title (e.g. Manali)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-400 transition"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-400 transition"
                  />
                  <input
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-400 transition"
                  />
                </div>

                <input
                  placeholder="Duration (e.g. 5 days)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-400 transition"
                />

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">
                    Cover image (Drive se upload hoga)
                    {editingTrip ? ' — khali chhodo agar badalna nahi' : ''}
                  </label>
                  {editingTrip?.coverImage && (
                    <img
                      src={editingTrip.coverImage}
                      className="w-16 h-16 rounded-lg object-cover mb-2 border border-slate-700"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-400/10 file:text-cyan-300 file:text-sm"
                  />
                </div>

                <input
                  placeholder="Tags (comma separated: mountains, snow, trekking)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-400 transition"
                />

                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800/70 rounded-xl px-4 py-2.5 outline-none border border-slate-700 focus:border-cyan-400 transition"
                  rows={3}
                />

                <button
                  disabled={saving}
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 hover:opacity-90 text-slate-950 font-semibold rounded-xl py-3 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTrip ? 'Update Trip' : 'Add Trip'}
                </button>
                {message && <p className="text-sm text-slate-300">{message}</p>}
              </form>
            </motion.div>
          )}

          {activeTab === 'trips' && (
            <motion.div
              key="trips"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                Trips ({trips.length})
              </h1>
              <div className="space-y-3">
                <AnimatePresence>
                  {trips.map((trip) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur p-4"
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex gap-3">
                          {trip.coverImage && (
                            <img
                              src={trip.coverImage}
                              className="w-14 h-14 rounded-lg object-cover shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-semibold">{trip.title}</p>
                            <p className="text-sm text-slate-400">
                              {trip.location} {trip.state && `· ${trip.state}`}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {trip.photos?.length || 0} photos · {trip.videos?.length || 0} videos
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => startEdit(trip)}
                            className="text-cyan-300 text-xs border border-cyan-500/30 hover:bg-cyan-500/10 rounded-lg px-3 py-1.5 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(trip.id)}
                            className="text-red-400 text-xs border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {(trip.photos?.length > 0 || trip.videos?.length > 0) && (
                        <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
                          {trip.photos?.map((p) => (
                            <img
                              key={p.fileId}
                              src={p.url}
                              className="w-16 h-16 object-cover rounded-lg shrink-0 border border-slate-700"
                            />
                          ))}
                          {trip.videos?.map((v) => (
                            <div
                              key={v.fileId}
                              className="w-16 h-16 rounded-lg shrink-0 border border-slate-700 bg-slate-800 flex items-center justify-center text-xs text-cyan-300"
                            >
                              ▶ video
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="text-xs inline-block bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer hover:border-cyan-400/50 transition">
                        {uploadingTripId === trip.id
                          ? uploadProgress
                            ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                            : 'Uploading...'
                          : '+ Add Photos / Videos'}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          disabled={uploadingTripId === trip.id}
                          onChange={(e) => handleMediaUpload(trip, e.target.files)}
                        />
                      </label>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {trips.length === 0 && (
                  <p className="text-slate-500 text-sm">Koi trip nahi hai abhi.</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                Site Settings
              </h1>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
                <p className="text-sm font-semibold text-cyan-300 mb-1">Homepage Hero Background</p>
                <p className="text-xs text-slate-400 mb-4">
                  Ye photo Home page ke "Explore The World With Shubham" section ke peeche dikhegi.
                </p>

                {heroImage && (
                  <img
                    src={heroImage}
                    className="w-full h-40 object-cover rounded-xl mb-4 border border-white/10"
                  />
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHeroFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-400/10 file:text-cyan-300 file:text-sm mb-3"
                />

                <button
                  onClick={handleHeroSave}
                  disabled={!heroFile || heroSaving}
                  className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 text-slate-950 font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {heroSaving ? 'Saving...' : 'Save Hero Image'}
                </button>
                {heroMessage && <p className="text-sm text-slate-300 mt-2">{heroMessage}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
