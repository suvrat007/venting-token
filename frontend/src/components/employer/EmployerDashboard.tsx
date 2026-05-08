import { useAccount } from 'wagmi'
import { useEmployerStats, useAllEmployeeData } from '../../hooks/useContractData'
import { formatTokens } from '../../lib/contracts'
import DepositTokensForm from './DepositTokensForm'
import HireEmployeeForm from './HireEmployeeForm'
import EmployeeTable from './EmployeeTable'
import LoadingSpinner from '../shared/LoadingSpinner'

type EmployeeRow = {
  vestingInfo: { totalTokens: bigint; tokensVested: bigint }
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${warn ? 'border-red-300' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function EmployerDashboard() {
  const { address } = useAccount()
  const { data: stats, isLoading } = useEmployerStats(address)
  const { data: employeeData }     = useAllEmployeeData()

  const contractBalance = stats?.[0]?.result as bigint | undefined
  const employeeCount   = stats?.[1]?.result as bigint | undefined
  const walletBalance   = stats?.[2]?.result as bigint | undefined

  const employees = (employeeData ?? []) as unknown as EmployeeRow[]
  const totalPromised = employees.reduce(
    (sum, emp) => sum + emp.vestingInfo.totalTokens - emp.vestingInfo.tokensVested,
    0n,
  )
  const isUnderfunded = contractBalance !== undefined && totalPromised > contractBalance

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage employees and token vesting. Data auto-refreshes every 30 s.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <LoadingSpinner label="Loading stats…" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard label="Active Employees" value={employeeCount !== undefined ? String(employeeCount) : '—'} />
            <StatCard label="Contract Balance" value={`${formatTokens(contractBalance)} VTK`} />
            <StatCard label="Total Promised"   value={`${formatTokens(totalPromised)} VTK`} warn={isUnderfunded} />
            <StatCard label="Your Wallet"       value={`${formatTokens(walletBalance)} VTK`} />
          </div>
          {isUnderfunded && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="font-bold mt-0.5">!</span>
              <span>
                Pool underfunded — employees are owed{' '}
                <strong>{formatTokens(totalPromised)} VTK</strong> but the contract only holds{' '}
                <strong>{formatTokens(contractBalance)} VTK</strong>. Deposit more tokens to avoid
                failed claim transactions.
              </span>
            </div>
          )}
        </>
      )}

      {/* Deposit */}
      <DepositTokensForm />

      {/* Hire */}
      <HireEmployeeForm />

      {/* Employee list */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">All Employees</h2>
        <EmployeeTable />
      </div>
    </div>
  )
}
