import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useDebounce } from '../../hooks/useDebounce'
import { useTokenBalance, useTokenAllowance, useContractBalance, useTokenMeta } from '../../hooks/useContractData'
import { useApprove, useDepositTokens } from '../../hooks/useContractActions'
import { useInvalidateOnSuccess } from '../../hooks/useInvalidateOnSuccess'
import { formatTokens } from '../../lib/contracts'
import TxStatus from '../shared/TxStatus'

export default function DepositTokensForm() {
  const { address } = useAccount()
  const [amountInput, setAmountInput] = useState('')
  const debouncedAmount = useDebounce(amountInput, 400)

  const amount = debouncedAmount && !isNaN(Number(debouncedAmount))
    ? BigInt(Math.floor(Number(debouncedAmount)))
    : 0n

  const { data: walletBalance }   = useTokenBalance(address)
  const { data: allowance }       = useTokenAllowance(address)
  const { data: contractBalance } = useContractBalance()
  const { symbol, decimals }      = useTokenMeta()

  const needsApproval = allowance !== undefined && amount > 0n && (allowance as bigint) < amount

  const { approve, isPending: approvePending, isConfirming: approveConfirming,
          isSuccess: approveSuccess, error: approveError } = useApprove()

  const { deposit, isPending: depositPending, isConfirming: depositConfirming,
          isSuccess: depositSuccess, error: depositError } = useDepositTokens()

  useInvalidateOnSuccess(depositSuccess)

  const busy = approvePending || approveConfirming || depositPending || depositConfirming

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount <= 0n) return
    if (needsApproval) {
      approve(amount)
    } else {
      deposit(amount)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <h2 className="text-base font-semibold text-white mb-1">Deposit {symbol}</h2>
      <p className="text-xs text-zinc-500 mb-5">Fund the vesting pool</p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Contract Balance</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatTokens(contractBalance as bigint | undefined, decimals)} {symbol}
          </p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3">
          <p className="text-xs text-zinc-500 mb-0.5">Your Wallet</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {formatTokens(walletBalance as bigint | undefined, decimals)} {symbol}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="number"
          min="1"
          placeholder="Amount to deposit"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition"
        />
        <button
          type="submit"
          disabled={busy || amount <= 0n}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap"
        >
          {busy ? '…' : needsApproval ? 'Approve' : 'Deposit'}
        </button>
      </form>

      <TxStatus
        isPending={approvePending || depositPending}
        isConfirming={approveConfirming || depositConfirming}
        isSuccess={approveSuccess || depositSuccess}
        error={approveError ?? depositError}
        successMsg={approveSuccess ? 'Approved! Now click Deposit.' : 'Tokens deposited.'}
      />
    </div>
  )
}
