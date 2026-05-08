import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import VestingStatusCard from './VestingStatusCard'

export default function EmployeeDashboard() {
  const { address } = useAccount()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">My Vesting</h1>
        <p className="text-sm text-zinc-500 mt-1">Your token allocation and claimable amounts.</p>
      </div>
      <VestingStatusCard address={address as Address} />
    </div>
  )
}
