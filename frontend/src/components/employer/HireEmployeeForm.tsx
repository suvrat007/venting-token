import { useState } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'
import { useDebounce } from '../../hooks/useDebounce'
import { useAllEmployeeData, useContractBalance } from '../../hooks/useContractData'
import { useHireEmployee } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import { formatTokens } from '../../lib/contracts'
import TxStatus from '../shared/TxStatus'

export default function HireEmployeeForm() {
  const [address, setAddress]         = useState('')
  const [name, setName]               = useState('')
  const [totalTokens, setTotalTokens] = useState('')
  const [joiningBonus, setJoiningBonus] = useState('0')

  const debouncedAddress = useDebounce(address, 400)
  const addressValid = isAddress(debouncedAddress)

  const { hire, isPending, isConfirming, isSuccess, error } = useHireEmployee()
  useInvalidateOnSuccess(isSuccess)

  const { data: contractBalance } = useContractBalance()
  const { data: employeeData }    = useAllEmployeeData()

  const totalPromised = ((employeeData ?? []) as unknown as { vestingInfo: { totalTokens: bigint; tokensVested: bigint } }[])
    .reduce((sum, emp) => sum + emp.vestingInfo.totalTokens - emp.vestingInfo.tokensVested, 0n)

  const newTotalTokensBigInt = totalTokens ? BigInt(Math.floor(Number(totalTokens))) : 0n
  const availableAfterHire   = (contractBalance as bigint | undefined) !== undefined
    ? (contractBalance as bigint) - totalPromised - newTotalTokensBigInt
    : undefined
  const wouldUnderfund = availableAfterHire !== undefined && availableAfterHire < 0n

  const busy = isPending || isConfirming

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addressValid || !name || !totalTokens) return
    hire(
      debouncedAddress as Address,
      name,
      BigInt(Math.floor(Number(totalTokens))),
      BigInt(Math.floor(Number(joiningBonus || 0))),
    )
  }

  function reset() {
    setAddress(''); setName(''); setTotalTokens(''); setJoiningBonus('0')
  }

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 text-center">
        <p className="text-green-700 font-medium mb-3">Employee hired successfully!</p>
        <button onClick={reset} className="text-sm text-brand-600 hover:underline">
          Hire another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Hire Employee</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Wallet Address</label>
          <input
            type="text"
            placeholder="0x…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500
              ${address && !addressValid ? 'border-red-400' : 'border-gray-300'}`}
          />
          {address && !addressValid && (
            <p className="text-xs text-red-500 mt-1">Invalid address</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            type="text"
            placeholder="Alice Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Total Tokens (VTK)</label>
          <input
            type="number"
            min="1"
            placeholder="10000"
            value={totalTokens}
            onChange={(e) => setTotalTokens(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Joining Bonus (VTK)</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={joiningBonus}
            onChange={(e) => setJoiningBonus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">Transferred immediately at hire</p>
        </div>

        {wouldUnderfund && totalTokens && (
          <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            Pool only has <strong>{formatTokens(contractBalance as bigint | undefined)} VTK</strong> available
            after existing commitments. This allocation would exceed it by{' '}
            <strong>{formatTokens(0n - availableAfterHire!)} VTK</strong> — deposit more tokens first.
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy || !addressValid || !name || !totalTokens}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition"
          >
            {busy ? 'Submitting…' : 'Hire Employee'}
          </button>
        </div>
      </form>

      <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={false} error={error} />
    </div>
  )
}
