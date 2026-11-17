export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="icon-tile text-white font-bold"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          fontSize: size * 0.5,
          background: "linear-gradient(145deg, #2b95ff 0%, #0050c8 55%, #1a237e 100%)",
          boxShadow: "0 6px 18px -6px rgba(10,132,255,.8), inset 0 1px 0 rgba(255,255,255,.3)",
        }}
      >
        T
      </div>
      <span className="text-[19px] font-semibold tracking-tight">TabDin</span>
    </div>
  );
}
