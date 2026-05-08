import type { Address } from 'viem'

export const VENTING_TOKEN_ADDRESS =
  (import.meta.env.VITE_VENTING_TOKEN_ADDRESS as Address | undefined) ??
  '0x0000000000000000000000000000000000000000'

export const VENTING_ERC20_ADDRESS =
  (import.meta.env.VITE_VENTING_ERC20_ADDRESS as Address | undefined) ??
  '0x0000000000000000000000000000000000000000'

export const POLL_INTERVAL_MS = 30_000

/** Format a raw token count (decimals=0) as a locale string */
export function formatTokens(raw: bigint | undefined): string {
  if (raw === undefined) return '—'
  return Number(raw).toLocaleString()
}

/** Percentage 0-100 of vested tokens */
export function vestingPercent(vested: bigint, total: bigint): number {
  if (total === 0n) return 0
  return Math.min(100, Number((vested * 100n) / total))
}

/** Convert a "days" input string to seconds bigint */
export function daysToSeconds(days: string): bigint {
  return BigInt(Math.round(parseFloat(days) * 86400))
}
