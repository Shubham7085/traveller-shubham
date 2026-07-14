export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 mt-20">
      <div className="max-w-6xl mx-auto px-5 py-12 flex flex-col sm:flex-row justify-between gap-8">
        <div>
          <p className="font-bold text-white text-lg">
            Travel<span className="text-amber-400"> With Shubham</span>
          </p>
          <p className="text-slate-400 text-sm mt-2 max-w-xs">
            Har trip ki kahani — photos, memories aur experiences ek jagah.
          </p>
        </div>

        <div className="flex gap-10 text-sm">
          <div>
            <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Explore</p>
            <div className="flex flex-col gap-1.5 text-slate-300">
              <a href="#trips" className="hover:text-amber-400 transition">
                Trips
              </a>
              <a href="#about" className="hover:text-amber-400 transition">
                About
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-slate-600 pb-8">
        © {new Date().getFullYear()} Travel With Shubham. Made with ❤ for the road.
      </div>
    </footer>
  )
}
