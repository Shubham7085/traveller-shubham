import { motion } from 'framer-motion'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35 }}
      className="flex items-center gap-2 bg-white/[0.06] border border-white/15 backdrop-blur-2xl rounded-full p-2 pl-5 max-w-md shadow-xl shadow-black/30"
    >
      <span className="text-slate-400">🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search destinations, trips..."
        className="bg-transparent outline-none text-sm text-white placeholder:text-slate-400 flex-1 min-w-0"
      />
      <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-sm font-semibold px-5 py-2 rounded-full shrink-0">
        Find
      </span>
    </motion.div>
  )
}
