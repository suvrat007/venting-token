import { useState, useEffect } from 'react'
import type { Address } from 'viem'
import { useSetVestingSchedule } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import TxStatus from '../shared/TxStatus'

interface Milestone {
  years: string
  percent: string
}

const PRESETS: { label: string; milestones: Milestone[] }[] = [
  {
    label: '4-year standard',
    milestones: [
      { years: '1', percent: '25' },
      { years: '2', percent: '50' },
      { years: '3', percent: '75' },
      { years: '4', percent: '100' },
    ],
  },
  {
    label: '2-year cliff',
    milestones: [
      { years: '1', percent: '50' },
      { years: '2', percent: '100' },
    ],
  },
  {
    label: 'Immediate',
    milestones: [{ years: '0.003', percent: '100' }],
  },
]

interface Props {
  employeeAddress: Address
  employeeName: string
  onClose: () => void
}

export default function SetVestingScheduleForm({ employeeAddress, employeeName, onClose }: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>(PRESETS[0].milestones)

  const { setSchedule, isPending, isConfirming, isSuccess, error } = useSetVestingSchedule()
  useInvalidateOnSuccess(isSuccess)
  useEffect(() => { if (isSuccess) onClose() }, [isSuccess, onClose])

  const lastPct = milestones.length > 0 ? (parseFloat(milestones[milestones.length - 1].percent) || 0) : 0
  const isIncreasing = milestones.every(
    (m, i) => i === 0 || (parseFloat(m.percent) || 0) > (parseFloat(milestones[i - 1].percent) || 0),
  )
  const percentValid = Math.abs(lastPct - 100) < 0.01 && isIncreasing

  function updateRow(i: number, field: keyof Milestone, val: string) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!percentValid) return
    const durations   = milestones.map((m) => BigInt(Math.round((parseFloat(m.years) || 0) * 365 * 86400)))
    const percentages = milestones.map((m) => BigInt(Math.round(parseFloat(m.percent))))
    setSchedule(employeeAddress, durations, percentages)
  }

  const inputCls =
    'bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition w-full'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-white">Vesting Schedule</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{employeeName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 text-xl leading-none transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Quick presets</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMilestones(p.milestones)}
                  className="text-xs border border-zinc-700 text-zinc-400 rounded-lg px-3 py-1.5 hover:bg-zinc-800 hover:border-brand-500/50 hover:text-zinc-200 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wide px-1">
              <span>After (years)</span>
              <span>Unlock (%)</span>
              <span />
            </div>

            {milestones.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input
                  type="number"
                  min="0.001"
                  step="0.5"
                  placeholder="1"
                  value={m.years}
                  onChange={(e) => updateRow(i, 'years', e.target.value)}
                  className={inputCls}
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="25"
                  value={m.percent}
                  onChange={(e) => updateRow(i, 'percent', e.target.value)}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setMilestones((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-zinc-600 hover:text-red-400 px-1 transition"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setMilestones((prev) => [...prev, { years: '', percent: '' }])}
              className="text-sm text-brand-400 hover:text-brand-300 transition pl-1"
            >
              + Add milestone
            </button>
          </div>

          <p className={`text-sm font-medium ${percentValid ? 'text-emerald-400' : 'text-red-400'}`}>
            {percentValid
              ? '✓ Final milestone is 100%'
              : !isIncreasing
                ? 'Percentages must be strictly increasing'
                : `Final milestone must be 100% (currently ${lastPct.toFixed(0)}%)`}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!percentValid || isPending || isConfirming}
              className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition"
            >
              {isPending || isConfirming ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>

          <TxStatus
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            error={error}
            successMsg="Schedule saved!"
          />
        </form>
      </div>
    </div>
  )
}
