import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useDebounce } from '../../hooks/useDebounce'
import { useTokenBalance, useTokenAllowance, useContractBalance } from '../../hooks/useContractData'
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Deposit Tokens</h2>
      <p className="text-sm text-gray-500 mb-4">
        Fund the vesting pool. Contract balance:{' '}
        <span className="font-medium text-gray-800">{formatTokens(contractBalance as bigint | undefined)} VTK</span>
      </p>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        Your wallet: <span className="font-medium text-gray-800">{formatTokens(walletBalance as bigint | undefined)} VTK</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="number"
          min="1"
          placeholder="Amount"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={busy || amount <= 0n}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
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
