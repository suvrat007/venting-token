import type { Address } from 'viem'
import { useVestingStatus, useTokenBalance, useEmployeeRecord, useTokenMeta } from '../../hooks/useContractData'
import { useClaimVestedTokens } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import { formatTokens, vestingPercent } from '../../lib/contracts'
import LoadingSpinner from '../shared/LoadingSpinner'
import TxStatus from '../shared/TxStatus'

function toDays(seconds: bigint): string {
  return (Number(seconds) / 86400).toFixed(0)
}

interface Props {
  address: Address
}

export default function VestingStatusCard({ address }: Props) {
  const { data: status, isLoading: statusLoading } = useVestingStatus(address)
  const { data: record, isLoading: recordLoading }  = useEmployeeRecord(address)
  const { data: walletBalance }                     = useTokenBalance(address)
  const { claim, isPending, isConfirming, isSuccess, error } = useClaimVestedTokens()
  const { symbol, decimals } = useTokenMeta()
  useInvalidateOnSuccess(isSuccess)

  if (statusLoading || recordLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading vesting data…" />
      </div>
    )
  }

  if (!status || !record) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center text-zinc-500">
        No vesting record found for this address.
      </div>
    )
  }

  const [totalTokens, tokensVested, claimable, milestones, percentages] = status as [
    bigint, bigint, bigint, readonly bigint[], readonly bigint[]
  ]

  const empRecord = record as unknown as {
    name: string
    hireDate: bigint
    vestingInfo: { schedule: { cliffDuration: bigint } }
  }

  const pct         = vestingPercent(tokensVested, totalTokens)
  const hireDate    = new Date(Number(empRecord.hireDate) * 1000)
  const cliffDays   = toDays(empRecord.vestingInfo.schedule.cliffDuration || 0n)
  const hasSchedule = milestones.length > 0
  const now         = BigInt(Math.floor(Date.now() / 1000))

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{empRecord.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Hired {hireDate.toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Wallet</p>
            <p className="text-lg font-bold text-white tabular-nums">
              {formatTokens(walletBalance as bigint | undefined, decimals)} {symbol}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>Vested: <span className="text-zinc-300 tabular-nums">{formatTokens(tokensVested, decimals)}</span></span>
            <span>Total: <span className="text-zinc-300 tabular-nums">{formatTokens(totalTokens, decimals)}</span></span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-brand-600 to-brand-400 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-right tabular-nums">{pct}% vested</p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-4">Available to Claim</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-4xl font-bold text-brand-400 tabular-nums">{formatTokens(claimable, decimals)}</p>
            <p className="text-sm text-zinc-500 mt-1">{symbol} tokens</p>
          </div>
          <button
            onClick={() => claim()}
            disabled={claimable === 0n || isPending || isConfirming}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white px-7 py-3.5 rounded-xl font-semibold transition flex-shrink-0"
          >
            {isPending || isConfirming ? 'Claiming…' : 'Claim'}
          </button>
        </div>
        <TxStatus
          isPending={isPending}
          isConfirming={isConfirming}
          isSuccess={isSuccess}
          error={error}
          successMsg="Tokens claimed successfully!"
        />
      </div>

      {hasSchedule && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Vesting Schedule</h3>
          <p className="text-xs text-zinc-600 mb-5">Cliff: {cliffDays} days from hire</p>

          <div className="space-y-4">
            {milestones.map((ms, i) => {
              const unlockTime = empRecord.hireDate + ms
              const reached    = now >= unlockTime
              const unlockDate = new Date(Number(unlockTime) * 1000).toLocaleDateString()
              const pctAtStep  = percentages[i]

              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                      reached
                        ? 'bg-brand-600 text-white'
                        : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                    }`}
                  >
                    {reached ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={reached ? 'text-zinc-200' : 'text-zinc-500'}>
                        {toDays(ms)} days
                        <span className="text-zinc-600 ml-1.5 text-xs">({unlockDate})</span>
                      </span>
                      <span className={`font-semibold tabular-nums ${reached ? 'text-brand-400' : 'text-zinc-600'}`}>
                        {String(pctAtStep)}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1">
                      <div
                        className="bg-brand-600 h-1 rounded-full transition-all"
                        style={{ width: reached ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!hasSchedule && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400">
          No vesting schedule set yet. Contact your employer.
        </div>
      )}
    </div>
  )
}
