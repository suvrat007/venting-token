import { useState } from 'react'
import type { Address } from 'viem'
import { isAddress } from 'viem'
import { useDebounce } from '../../hooks/useDebounce'
import { useAllEmployeeData, useContractBalance, useTokenMeta } from '../../hooks/useContractData'
import { useHireEmployee } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import { formatTokens } from '../../lib/contracts'
import TxStatus from '../shared/TxStatus'

const inputCls =
  'w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition'
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5'

export default function HireEmployeeForm() {
  const [address, setAddress]           = useState('')
  const [name, setName]                 = useState('')
  const [totalTokens, setTotalTokens]   = useState('')
  const [joiningBonus, setJoiningBonus] = useState('0')

  const debouncedAddress = useDebounce(address, 400)
  const addressValid = isAddress(debouncedAddress)

  const { hire, isPending, isConfirming, isSuccess, error } = useHireEmployee()
  useInvalidateOnSuccess(isSuccess)

  const { data: contractBalance } = useContractBalance()
  const { data: employeeData }    = useAllEmployeeData()
  const { symbol, decimals }      = useTokenMeta()

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
      <div className="bg-zinc-900 rounded-2xl border border-emerald-500/20 p-6 text-center">
        <p className="text-emerald-400 font-medium mb-3">Employee hired successfully!</p>
        <button onClick={reset} className="text-sm text-brand-400 hover:text-brand-300 transition">
          Hire another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <h2 className="text-base font-semibold text-white mb-5">Hire Employee</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Wallet Address</label>
          <input
            type="text"
            placeholder="0x…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`${inputCls} ${address && !addressValid ? 'border-red-500/50 focus:ring-red-500/40' : ''}`}
          />
          {address && !addressValid && (
            <p className="text-xs text-red-400 mt-1.5">Invalid Ethereum address</p>
          )}
        </div>

        <div>
          <label className={labelCls}>Full Name</label>
          <input
            type="text"
            placeholder="Alice Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Total Tokens ({symbol})</label>
            <input
              type="number"
              min="1"
              placeholder="10000"
              value={totalTokens}
              onChange={(e) => setTotalTokens(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Joining Bonus ({symbol})</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={joiningBonus}
              onChange={(e) => setJoiningBonus(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-zinc-600 mt-1">Sent immediately at hire</p>
          </div>
        </div>

        {wouldUnderfund && totalTokens && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-400">
            Pool only has{' '}
            <strong className="text-amber-300">
              {formatTokens(contractBalance as bigint | undefined, decimals)} {symbol}
            </strong>{' '}
            available after existing commitments. Deposit more tokens first.
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !addressValid || !name || !totalTokens}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white py-2.5 rounded-lg text-sm font-medium transition"
        >
          {busy ? 'Submitting…' : 'Hire Employee'}
        </button>
      </form>

      <TxStatus isPending={isPending} isConfirming={isConfirming} isSuccess={false} error={error} />
    </div>
  )
}
