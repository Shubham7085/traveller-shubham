export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050810]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1f] via-[#050810] to-black" />
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-cyan-400/15 rounded-full blur-[130px] animate-pulse" />
      <div
        className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[130px] animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute bottom-[-15%] left-[15%] w-[480px] h-[480px] bg-amber-400/12 rounded-full blur-[130px] animate-pulse"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: '1.5s' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#050810_75%)]" />
    </div>
  )
}
