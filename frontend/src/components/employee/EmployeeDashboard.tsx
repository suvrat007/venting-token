import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import VestingStatusCard from './VestingStatusCard'

export default function EmployeeDashboard() {
  const { address } = useAccount()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Vesting</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your token allocation and claimable amounts. Data auto-refreshes every 30 s.
        </p>
      </div>
      <VestingStatusCard address={address as Address} />
    </div>
  )
}
