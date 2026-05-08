import { useState } from 'react'
import type { Address } from 'viem'
import { useSetVestingSchedule } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import TxStatus from '../shared/TxStatus'

type Unit = 'days' | 'months' | 'years'

interface Milestone {
  value: string
  unit: Unit
  percent: string
}

const UNIT_LABELS: Record<Unit, string> = { days: 'Days', months: 'Months', years: 'Years' }

function toDays(value: string, unit: Unit): number {
  const n = parseFloat(value) || 0
  if (unit === 'years')  return Math.round(n * 365)
  if (unit === 'months') return Math.round(n * 30.44)
  return Math.round(n)
}

function humanLabel(value: string, unit: Unit): string {
  const n = parseFloat(value)
  if (!n) return ''
  const days = toDays(value, unit)
  if (unit === 'years')  return `${n} yr${n !== 1 ? 's' : ''} (${days} days)`
  if (unit === 'months') return `${n} mo${n !== 1 ? 's' : ''} (${days} days)`
  return `${days} days`
}

interface Props {
  employeeAddress: Address
  employeeName:    string
  onClose:         () => void
}

export default function SetVestingScheduleForm({ employeeAddress, employeeName, onClose }: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>([
    { value: '1', unit: 'years', percent: '25' },
    { value: '2', unit: 'years', percent: '50' },
    { value: '3', unit: 'years', percent: '75' },
    { value: '4', unit: 'years', percent: '100' },
  ])

  const { setSchedule, isPending, isConfirming, isSuccess, error } = useSetVestingSchedule()
  useInvalidateOnSuccess(isSuccess)

  const totalPercent = milestones.reduce((s, m) => s + (parseFloat(m.percent) || 0), 0)
  const percentValid = Math.abs(totalPercent - 100) < 0.01

  function updateRow(i: number, field: keyof Milestone, val: string) {
    setMilestones((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }

  function addRow() {
    setMilestones((prev) => [...prev, { value: '', unit: 'years', percent: '' }])
  }

  function removeRow(i: number) {
    setMilestones((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!percentValid) return
    const durations   = milestones.map((m) => BigInt(toDays(m.value, m.unit) * 86400))
    const percentages = milestones.map((m) => BigInt(Math.round(parseFloat(m.percent))))
    setSchedule(employeeAddress, durations, percentages)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Set Vesting Schedule</h2>
            <p className="text-sm text-gray-500 mt-0.5">{employeeName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Duration from hire</span>
            <span>Unit</span>
            <span>Cumulative %</span>
            <span />
          </div>

          {milestones.map((m, i) => (
            <div key={i} className="space-y-0.5">
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  placeholder="1"
                  value={m.value}
                  onChange={(e) => updateRow(i, 'value', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <select
                  value={m.unit}
                  onChange={(e) => updateRow(i, 'unit', e.target.value as Unit)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
                    <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="25"
                  value={m.percent}
                  onChange={(e) => updateRow(i, 'percent', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-red-400 hover:text-red-600 px-2"
                >
                  ×
                </button>
              </div>
              {m.value && (
                <p className="text-xs text-gray-400 pl-1">{humanLabel(m.value, m.unit)}</p>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="text-sm text-brand-600 hover:underline"
          >
            + Add milestone
          </button>

          <div className={`text-sm font-medium ${percentValid ? 'text-green-600' : 'text-red-500'}`}>
            Total: {totalPercent.toFixed(0)}% {!percentValid && '(must equal 100%)'}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!percentValid || isPending || isConfirming}
              className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition"
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
          {isSuccess && (
            <button type="button" onClick={onClose} className="w-full text-sm text-brand-600 hover:underline">
              Close
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
