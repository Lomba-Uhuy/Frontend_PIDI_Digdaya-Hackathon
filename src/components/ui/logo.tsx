import Image from "next/image";

/** TradeConnect brand mark (square emblem). Use `size` in px. */
export function Logo({ size = 28, className = "", priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo-tradeconnect.webp"
      alt="TradeConnect"
      width={256}
      height={256}
      priority={priority}
      unoptimized
      className={`rounded-lg object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
