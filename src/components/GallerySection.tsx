import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trip } from '../types'

export default function GallerySection({ trips }: { trips: Trip[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const allPhotos = trips.flatMap((t) =>
    (t.photos || []).map((p) => ({ ...p, tripTitle: t.title }))
  )

  if (allPhotos.length === 0) return null

  return (
    <section id="gallery" className="max-w-5xl mx-auto px-5 mb-28 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <p className="text-amber-400 text-xs tracking-[0.3em] font-semibold mb-2">MEMORIES</p>
        <h2 className="text-3xl sm:text-4xl font-bold">Gallery</h2>
      </motion.div>

      <div className="columns-2 sm:columns-3 gap-3 space-y-3">
        {allPhotos.map((photo, i) => (
          <motion.button
            key={photo.fileId + i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 9) * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setLightbox(photo.url)}
            className="w-full rounded-2xl overflow-hidden border border-white/10 break-inside-avoid block"
          >
            <img src={photo.url} alt={photo.tripTitle} loading="lazy" className="w-full object-cover" />
          </motion.button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </section>
  )
}
