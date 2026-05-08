import type { Address } from 'viem'
import { useVestingStatus, useTokenBalance, useEmployeeRecord } from '../../hooks/useContractData'
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
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

  const pct        = vestingPercent(tokensVested, totalTokens)
  const hireDate   = new Date(Number(empRecord.hireDate) * 1000)
  const cliffDays  = toDays(empRecord.vestingInfo.schedule.cliffDuration || 0n)
  const hasSchedule = milestones.length > 0

  const now = BigInt(Math.floor(Date.now() / 1000))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{empRecord.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Hired {hireDate.toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Wallet Balance</p>
            <p className="text-lg font-bold text-gray-900">{formatTokens(walletBalance as bigint | undefined)} VTK</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Vested: {formatTokens(tokensVested)} VTK</span>
            <span>Total: {formatTokens(totalTokens)} VTK</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-brand-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{pct}% vested</p>
        </div>
      </div>

      {/* Claim card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Available to Claim</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-brand-600">{formatTokens(claimable)}</p>
            <p className="text-sm text-gray-500">VTK tokens</p>
          </div>
          <button
            onClick={() => claim()}
            disabled={claimable === 0n || isPending || isConfirming}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition"
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

      {/* Schedule / milestones */}
      {hasSchedule && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Vesting Schedule</h3>
          <p className="text-xs text-gray-400 mb-4">Cliff: {cliffDays} days from hire</p>

          <div className="space-y-3">
            {milestones.map((ms, i) => {
              const unlockTime = empRecord.hireDate + ms
              const reached    = now >= unlockTime
              const unlockDate = new Date(Number(unlockTime) * 1000).toLocaleDateString()
              const pctAtStep  = percentages[i]

              return (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${reached ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {reached ? '✓' : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className={reached ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                        {toDays(ms)} days &nbsp;({unlockDate})
                      </span>
                      <span className={reached ? 'text-brand-600 font-semibold' : 'text-gray-400'}>
                        {String(pctAtStep)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                      <div
                        className="bg-brand-400 h-1 rounded-full"
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          No vesting schedule set yet. Contact your employer.
        </div>
      )}
    </div>
  )
}
