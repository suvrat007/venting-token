import { useState } from 'react'
import type { Address } from 'viem'
import { useAllEmployeeData, useTokenMeta } from '../../hooks/useContractData'
import { useFireEmployee } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import { formatTokens, vestingPercent } from '../../lib/contracts'
import LoadingSpinner from '../shared/LoadingSpinner'
import SetVestingScheduleForm from './SetVestingScheduleForm'
import TxStatus from '../shared/TxStatus'

type EmployeeRow = {
  employeeAddress: Address
  name: string
  hireDate: bigint
  vestingInfo: {
    totalTokens: bigint
    tokensVested: bigint
    vestingStartDate: bigint
    schedule: {
      cliffDuration: bigint
      vestingMilestones: readonly bigint[]
      vestingPercentages: readonly bigint[]
    }
  }
}

function getNextMilestone(hireDate: bigint, milestones: readonly bigint[]) {
  if (milestones.length === 0) return null
  const now = BigInt(Math.floor(Date.now() / 1000))
  for (const ms of milestones) {
    const unlockAt = hireDate + ms
    if (now < unlockAt) {
      const secs = Number(unlockAt - now)
      const days = Math.floor(secs / 86400)
      const hrs  = Math.floor((secs % 86400) / 3600)
      const mins = Math.floor((secs % 3600) / 60)
      const label = days > 0 ? `${days}d ${hrs}h` : hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
      return { label, date: new Date(Number(unlockAt) * 1000) }
    }
  }
  return null // all milestones passed
}

function MilestoneBar({ vested, total }: { vested: bigint; total: bigint }) {
  const pct = vestingPercent(vested, total)
  return (
    <div className="w-full bg-zinc-800 rounded-full h-1.5">
      <div
        className="bg-brand-500 h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function FireButton({ address, name }: { address: Address; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const { fire, isPending, isConfirming, isSuccess, error } = useFireEmployee()
  useInvalidateOnSuccess(isSuccess)

  if (isSuccess) return <span className="text-xs text-zinc-600">Fired</span>

  if (confirm) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-red-400">Fire {name}?</p>
        <div className="flex gap-1">
          <button
            onClick={() => fire(address)}
            disabled={isPending || isConfirming}
            className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500/20 disabled:opacity-50 transition"
          >
            {isPending || isConfirming ? '…' : 'Yes, Fire'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="text-xs border border-zinc-700 text-zinc-400 px-2 py-1 rounded hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
        </div>
        <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={false} error={error} />
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs text-zinc-600 hover:text-red-400 transition"
    >
      Fire
    </button>
  )
}

export default function EmployeeTable() {
  const { data, isLoading, error } = useAllEmployeeData()
  const { symbol, decimals }       = useTokenMeta()
  const [scheduleTarget, setScheduleTarget] = useState<EmployeeRow | null>(null)

  if (isLoading) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex justify-center">
        <LoadingSpinner label="Loading employees…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-red-500/20 p-6 text-red-400 text-sm">
        Failed to load employees.
      </div>
    )
  }

  const employees = (data ?? []) as EmployeeRow[]

  if (employees.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
        <p className="text-zinc-600 text-sm">No employees hired yet.</p>
        <p className="text-zinc-700 text-xs mt-1">Use the form above to hire your first employee.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Allocation</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Vested</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Progress</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Hired</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {employees.map((emp) => {
              const { totalTokens, tokensVested } = emp.vestingInfo
              const hasSchedule = emp.vestingInfo.schedule.vestingMilestones.length > 0
              const hiredDate = new Date(Number(emp.hireDate) * 1000).toLocaleDateString()

              const next = getNextMilestone(emp.hireDate, emp.vestingInfo.schedule.vestingMilestones)

              return (
                <tr key={emp.employeeAddress} className="hover:bg-zinc-800/40 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-100">{emp.name}</span>
                      {!hasSchedule && (
                        <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md px-1.5 py-0.5 leading-none">
                          No schedule
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 font-mono mt-0.5">
                      {emp.employeeAddress.slice(0, 8)}…{emp.employeeAddress.slice(-6)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-300 tabular-nums">{formatTokens(totalTokens, decimals)} {symbol}</td>
                  <td className="px-4 py-3.5 text-zinc-300 tabular-nums">{formatTokens(tokensVested, decimals)} {symbol}</td>
                  <td className="px-4 py-3.5 w-44">
                    <MilestoneBar vested={tokensVested} total={totalTokens} />
                    <span className="text-xs text-zinc-600 mt-1 block tabular-nums">
                      {vestingPercent(tokensVested, totalTokens)}%
                    </span>
                    {hasSchedule && (
                      next ? (
                        <span
                          className="text-xs text-brand-400 block mt-0.5 tabular-nums"
                          title={`Unlocks ${next.date.toLocaleString()}`}
                        >
                          Next in {next.label}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 block mt-0.5">Fully vested</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-500 text-xs">{hiredDate}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => setScheduleTarget(emp)}
                        className="text-xs text-brand-400 hover:text-brand-300 whitespace-nowrap transition"
                      >
                        {hasSchedule ? 'Edit Schedule' : 'Set Schedule'}
                      </button>
                      <FireButton address={emp.employeeAddress} name={emp.name} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {scheduleTarget && (
        <SetVestingScheduleForm
          employeeAddress={scheduleTarget.employeeAddress}
          employeeName={scheduleTarget.name}
          onClose={() => setScheduleTarget(null)}
        />
      )}
    </>
  )
}
