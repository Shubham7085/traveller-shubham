export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#05070f]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1f] via-[#05070f] to-black" />
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-amber-400/10 rounded-full blur-[130px] animate-pulse" />
      <div
        className="absolute top-[15%] right-[-15%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[130px] animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute bottom-[-15%] left-[15%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px] animate-pulse"
        style={{ animationDelay: '2s' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#05070f_75%)]" />
    </div>
  )
}
