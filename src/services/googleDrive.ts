const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const TOKEN_KEY = 'gdrive_access_token'
const EXPIRY_KEY = 'gdrive_token_expiry'
const EMAIL_KEY = 'gdrive_email'

export function beginDriveConnect() {
  const redirectUri = window.location.origin + window.location.pathname
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    prompt: 'consent',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function captureTokenFromRedirect(): boolean {
  if (!window.location.hash) return false
  const params = new URLSearchParams(window.location.hash.substring(1))
  const token = params.get('access_token')
  const expiresIn = params.get('expires_in')
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
    if (expiresIn) {
      sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + Number(expiresIn) * 1000))
    }
    window.history.replaceState({}, document.title, window.location.pathname)
    return true
  }
  return false
}

function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiry = sessionStorage.getItem(EXPIRY_KEY)
  if (!token) return null
  if (expiry && Date.now() > Number(expiry)) {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(EXPIRY_KEY)
    return null
  }
  return token
}

export function isDriveConnected() {
  return !!getToken()
}

export function getConnectedEmail() {
  return sessionStorage.getItem(EMAIL_KEY)
}

export function disconnectDrive() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRY_KEY)
  sessionStorage.removeItem(EMAIL_KEY)
}

export interface MediaItem {
  url: string
  fileId: string
  type: 'image' | 'video'
}

export async function uploadFileToDrive(file: File): Promise<MediaItem> {
  const token = getToken()
  if (!token) throw new Error('Pehle Drive connect karo')

  const metadata = { name: `${Date.now()}_${file.name}` }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
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
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })

  const isVideo = file.type.startsWith('video/')
  const url = isVideo
    ? `https://drive.google.com/file/d/${fileId}/preview`
    : `https://drive.google.com/uc?export=view&id=${fileId}`

  return { url, fileId, type: isVideo ? 'video' : 'image' }
}

export interface DriveStorageInfo {
  email: string
  usedBytes: number
  totalBytes: number | null
}

export async function getDriveStorageInfo(): Promise<DriveStorageInfo> {
  const token = getToken()
  if (!token) throw new Error('Pehle Drive connect karo')
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Storage info fetch failed')
  const data = await res.json()
  const email = data.user?.emailAddress || 'Unknown'
  sessionStorage.setItem(EMAIL_KEY, email)
  return {
    email,
    usedBytes: Number(data.storageQuota?.usage || 0),
    totalBytes: data.storageQuota?.limit ? Number(data.storageQuota.limit) : null,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + ' GB'
}
