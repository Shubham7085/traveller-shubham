export interface MediaItem {
  url: string
  fileId: string
  type: 'image' | 'video'
}

export interface Trip {
  id: string
  title: string
  location: string
  state: string
  description: string
  coverImage: string
  coverFileId: string
  duration: string
  tags: string[]
  photos: MediaItem[]
  videos: MediaItem[]
  createdAt: string
}
