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
} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import AuroraBackground from '../components/AuroraBackground'
import {
  initGoogleDrive,
  connectDrive,
  isDriveConnected,
  uploadFileToDrive,
  getDriveStorageInfo,
  formatBytes,
  getConnectedEmail,
  DriveStorageInfo,
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

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [driveReady, setDriveReady] = useState(false)
  const [driveError, setDriveError] = useState('')
  const [driveConnected, setDriveConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [storageInfo, setStorageInfo] = useState<DriveStorageInfo | null>(null)
  const [uploadingTripId, setUploadingTripId] = useState<string | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (!u) navigate('/login')
    })
    return unsub
  }, [navigate])

  const startDriveInit = () => {
    setDriveError('')
    setDriveReady(false)
    initGoogleDrive(
      () => setDriveReady(true),
      (msg) => setDriveError(msg)
    )
  }

  useEffect(() => {
    startDriveInit()
  }, [])

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
    setDuration('')
    setTags('')
    setCoverFile(null)
  }

  const handleConnectDrive = async () => {
    setConnecting(true)
    try {
      await connectDrive()
      setDriveConnected(true)
      const info = await getDriveStorageInfo()
      setStorageInfo(info)
    } catch (err: any) {
      alert('Drive connect nahi hua: ' + (err.message || JSON.stringify(err)))
    }
    setConnecting(false)
  }

  const refreshStorage = async () => {
    if (!isDriveConnected()) return
    try {
      const info = await getDriveStorageInfo()
      setStorageInfo(info)
    } catch {}
  }

  const handleAddTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      let coverImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
      let coverFileId = ''

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

      await addDoc(collection(db, 'trips'), {
        title: title.trim(),
        location: location.trim(),
        state: state.trim(),
        description: description.trim(),
        coverImage,
        coverFileId,
        duration: duration.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        photos: [],
        videos: [],
        createdAt: new Date().toISOString(),
      })
      resetForm()
      setMessage('Trip added ✅')
      loadTrips()
      refreshStorage()
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
      alert('Pehle upar se Google Drive connect karo')
      return
    }
    setUploadingTripId(trip.id)
    try {
      const newPhotos: any[] = []
      const newVideos: any[] = []
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadFileToDrive(files[i])
        if (uploaded.type === 'video') newVideos.push(uploaded)
        else newPhotos.push(uploaded)
      }
      const updates: any = {}
      if (newPhotos.length) updates.photos = arrayUnion(...newPhotos)
      if (newVideos.length) updates.videos = arrayUnion(...newVideos)
      await updateDoc(doc(db, 'trips', trip.id), updates)
      loadTrips()
      refreshStorage()
    } catch (err: any) {
      alert('Upload me error: ' + err.message)
    }
    setUploadingTripId(null)
  }

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    )

  return (
    <div className="min-h-screen text-white relative">
      <AuroraBackground />
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex justify-between items-center mb-6">
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

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl p-4 mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Google Drive</p>
              <p className="text-xs text-slate-400">
                {driveConnected
                  ? `Connected: ${getConnectedEmail() || '...'}`
                  : driveError
                  ? driveError
                  : driveReady
                  ? 'Photos/videos upload karne ke liye connect karo'
                  : 'Google script load ho raha hai...'}
              </p>
            </div>
            <button
              onClick={handleConnectDrive}
              disabled={!driveReady || connecting}
              className="text-sm bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg px-4 py-2 hover:bg-cyan-500/20 transition disabled:opacity-50 shrink-0"
            >
              {connecting ? 'Connecting...' : driveConnected ? 'Reconnect' : 'Connect Drive'}
            </button>
          </div>

          {driveError && (
            <button
              onClick={startDriveInit}
              className="text-xs text-cyan-400 underline mt-2"
            >
              Dubara try karo
            </button>
          )}

          {storageInfo && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Storage used</span>
                <span>
                  {formatBytes(storageInfo.usedBytes)}
                  {storageInfo.totalBytes ? ` / ${formatBytes(storageInfo.totalBytes)}` : ''}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{
                    width: storageInfo.totalBytes
                      ? `${Math.min(100, (storageInfo.usedBytes / storageInfo.totalBytes) * 100)}%`
                      : '5%',
                  }}
                />
              </div>
            </div>
          )}
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

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Cover image (Drive se upload hoga)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:text-cyan-300 file:text-sm"
            />
          </div>

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
                className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur p-4"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex gap-3">
                    {trip.coverImage && (
                      <img src={trip.coverImage} className="w-14 h-14 rounded-lg object-cover shrink-0" />
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
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="text-red-400 text-xs border border-red-500/30 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition shrink-0"
                  >
                    Delete
                  </button>
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

                <label className="text-xs inline-block bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 cursor-pointer hover:border-cyan-500/50 transition">
                  {uploadingTripId === trip.id ? 'Uploading...' : '+ Add Photos / Videos'}
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
        </div>
      </div>
    </div>
  )
  }
