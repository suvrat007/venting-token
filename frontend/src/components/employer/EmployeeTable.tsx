import { useState } from 'react'
import type { Address } from 'viem'
import { useAllEmployeeData } from '../../hooks/useContractData'
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

function MilestoneBar({ vested, total }: { vested: bigint; total: bigint }) {
  const pct = vestingPercent(vested, total)
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
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

  if (isSuccess) return <span className="text-xs text-gray-400">Fired</span>

  if (confirm) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-red-600">Fire {name}?</p>
        <div className="flex gap-1">
          <button
            onClick={() => fire(address)}
            disabled={isPending || isConfirming}
            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isPending || isConfirming ? '…' : 'Yes, Fire'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50"
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
      className="text-xs text-red-500 hover:text-red-700 hover:underline"
    >
      Fire
    </button>
  )
}

export default function EmployeeTable() {
  const { data, isLoading, error } = useAllEmployeeData()
  const [scheduleTarget, setScheduleTarget] = useState<EmployeeRow | null>(null)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex justify-center">
        <LoadingSpinner label="Loading employees…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 text-red-600 text-sm">
        Failed to load employees.
      </div>
    )
  }

  const employees = (data ?? []) as EmployeeRow[]

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-400 text-sm">
        No employees hired yet.
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Allocation</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Vested</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Progress</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Hired</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const { totalTokens, tokensVested } = emp.vestingInfo
              const hasSchedule = emp.vestingInfo.schedule.vestingMilestones.length > 0
              const hiredDate = new Date(Number(emp.hireDate) * 1000).toLocaleDateString()

              return (
                <tr key={emp.employeeAddress} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{emp.name}</span>
                      {!hasSchedule && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 leading-none">
                          No schedule
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      {emp.employeeAddress.slice(0, 8)}…{emp.employeeAddress.slice(-6)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatTokens(totalTokens)} VTK</td>
                  <td className="px-4 py-3 text-gray-700">{formatTokens(tokensVested)} VTK</td>
                  <td className="px-4 py-3 w-36">
                    <MilestoneBar vested={tokensVested} total={totalTokens} />
                    <span className="text-xs text-gray-400 mt-1 block">
                      {vestingPercent(tokensVested, totalTokens)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{hiredDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => setScheduleTarget(emp)}
                        className="text-xs text-brand-600 hover:underline whitespace-nowrap"
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
