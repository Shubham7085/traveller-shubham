declare global {
  interface Window {
    google: any
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

let tokenClient: any = null
let accessToken: string | null = null
let connectedEmail: string | null = null

export function initGoogleDrive(onReady: () => void, onError?: (msg: string) => void) {
  let attempts = 0
  const check = setInterval(() => {
    attempts++
    if (window.google && window.google.accounts) {
      clearInterval(check)
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {},
      })
      onReady()
    } else if (attempts > 40) {
      // ~8 seconds passed, script never loaded
      clearInterval(check)
      if (onError) {
        onError(
          'Google ka script load nahi hua. Phone ka Private DNS (NextDNS/AdGuard) ya koi ad-blocker/VPN accounts.google.com ko block kar raha ho sakta hai.'
        )
      }
    }
  }, 200)
}

export function connectDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error('Google script abhi load nahi hua, thoda wait karo'))
    tokenClient.callback = async (resp: any) => {
      if (resp.error) return reject(resp)
      accessToken = resp.access_token
      try {
        const info = await getDriveStorageInfo()
        connectedEmail = info.email
      } catch {
        connectedEmail = null
      }
      resolve(accessToken as string)
    }
    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function isDriveConnected() {
  return !!accessToken
}

export function getConnectedEmail() {
  return connectedEmail
}

export function disconnectDrive() {
  accessToken = null
  connectedEmail = null
}

export interface MediaItem {
  url: string
  fileId: string
  type: 'image' | 'video'
}

export async function uploadFileToDrive(file: File): Promise<MediaItem> {
  if (!accessToken) throw new Error('Pehle Drive connect karo')

  const metadata = { name: `${Date.now()}_${file.name}` }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
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
      Authorization: `Bearer ${accessToken}`,
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

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (!accessToken) throw new Error('Pehle Drive connect karo')
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export interface DriveStorageInfo {
  email: string
  usedBytes: number
  totalBytes: number | null
}

export async function getDriveStorageInfo(): Promise<DriveStorageInfo> {
  if (!accessToken) throw new Error('Pehle Drive connect karo')
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error('Storage info fetch failed')
  const data = await res.json()
  return {
    email: data.user?.emailAddress || 'Unknown',
    usedBytes: Number(data.storageQuota?.usage || 0),
    totalBytes: data.storageQuota?.limit ? Number(data.storageQuota.limit) : null,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB'
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + ' GB'
}
