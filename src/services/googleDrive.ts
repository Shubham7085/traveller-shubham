const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const ACCOUNTS_KEY = 'gdrive_accounts'

interface DriveAccount {
  email: string
  token: string
  expiresAt: number
  usedBytes: number
  totalBytes: number | null
}

function getAccounts(): DriveAccount[] {
  const raw = sessionStorage.getItem(ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const accounts: DriveAccount[] = JSON.parse(raw)
    return accounts.filter((a) => a.expiresAt > Date.now())
  } catch {
    return []
  }
}

function saveAccounts(accounts: DriveAccount[]) {
  sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function beginDriveConnect() {
  const redirectUri = window.location.origin + window.location.pathname
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'consent select_account',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function captureTokenFromRedirect(): Promise<boolean> {
  if (!window.location.hash) return false
  const params = new URLSearchParams(window.location.hash.substring(1))
  const token = params.get('access_token')
  const expiresIn = params.get('expires_in')
  if (!token) return false

  window.history.replaceState({}, document.title, window.location.pathname)

  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return false
  const data = await res.json()
  const email = data.user?.emailAddress || 'Unknown'
  const usedBytes = Number(data.storageQuota?.usage || 0)
  const totalBytes = data.storageQuota?.limit ? Number(data.storageQuota.limit) : null
  const expiresAt = Date.now() + Number(expiresIn || 3500) * 1000

  const accounts = getAccounts().filter((a) => a.email !== email)
  accounts.push({ email, token, expiresAt, usedBytes, totalBytes })
  saveAccounts(accounts)
  return true
}

export function isDriveConnected() {
  return getAccounts().length > 0
}

export function getConnectedAccounts() {
  return getAccounts()
}

export function removeAccount(email: string) {
  saveAccounts(getAccounts().filter((a) => a.email !== email))
}

function pickBestAccount(minFreeBytes: number): DriveAccount | null {
  const accounts = getAccounts()
  if (accounts.length === 0) return null
  const withSpace = accounts
    .map((a) => ({ ...a, free: a.totalBytes ? a.totalBytes - a.usedBytes : Infinity }))
    .filter((a) => a.free > minFreeBytes)
    .sort((a, b) => b.free - a.free)
  return withSpace[0] || accounts[0]
}

export interface MediaItem {
  url: string
  fileId: string
  type: 'image' | 'video'
}

export async function uploadFileToDrive(file: File): Promise<MediaItem> {
  const account = pickBestAccount(file.size)
  if (!account) throw new Error('Pehle Drive connect karo')

  const metadata = { name: `${Date.now()}_${file.name}` }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${account.token}` },
      body: form,
    }
  )

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    throw new Error('Upload failed: ' + errText)
  }

  const uploaded = await uploadRes.json()
  const fileId = uploaded.id

  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })

  const accounts = getAccounts().map((a) =>
    a.email === account.email ? { ...a, usedBytes: a.usedBytes + file.size } : a
  )
  saveAccounts(accounts)

  const isVideo = file.type.startsWith('video/')
  const url = isVideo
    ? `https://drive.google.com/file/d/${fileId}/preview`
    : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`

  return { url, fileId, type: isVideo ? 'video' : 'image' }
}

export function getAggregateStorage() {
  const accounts = getAccounts()
  const usedBytes = accounts.reduce((sum, a) => sum + a.usedBytes, 0)
  const totalBytes = accounts.reduce(
    (sum, a) => (a.totalBytes ? sum + a.totalBytes : sum),
    0
  )
  return { usedBytes, totalBytes: totalBytes || null, accountCount: accounts.length }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + ' GB'
                 }
