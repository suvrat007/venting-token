import { useAccount } from 'wagmi'
import { useEmployerStats, useAllEmployeeData, useTokenMeta } from '../../hooks/useContractData'
import { formatTokens } from '../../lib/contracts'
import DepositTokensForm from './DepositTokensForm'
import HireEmployeeForm from './HireEmployeeForm'
import EmployeeTable from './EmployeeTable'
import LoadingSpinner from '../shared/LoadingSpinner'

type EmployeeRow = {
  vestingInfo: { totalTokens: bigint; tokensVested: bigint }
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function VaultIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
    </svg>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  accent: string
  warn?: boolean
}

function StatCard({ label, value, icon, accent, warn }: StatCardProps) {
  return (
    <div className={`bg-zinc-900 rounded-2xl border p-5 ${warn ? 'border-red-500/30' : 'border-zinc-800'}`}>
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4 ${accent}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${warn ? 'text-red-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}

export default function EmployerDashboard() {
  const { address } = useAccount()
  const { data: stats, isLoading } = useEmployerStats(address)
  const { data: employeeData }     = useAllEmployeeData()
  const { symbol, decimals }       = useTokenMeta()

  const contractBalance = stats?.[0]?.result as bigint | undefined
  const employeeCount   = stats?.[1]?.result as bigint | undefined
  const walletBalance   = stats?.[2]?.result as bigint | undefined

  const employees = (employeeData ?? []) as unknown as EmployeeRow[]
  const totalPromised = employees.reduce(
    (sum, emp) => sum + emp.vestingInfo.totalTokens - emp.vestingInfo.tokensVested,
    0n,
  )
  const isUnderfunded = contractBalance !== undefined && totalPromised > contractBalance

  const fmt = (v: bigint | undefined) => `${formatTokens(v, decimals)} ${symbol}`

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Employer Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage employees and token vesting.</p>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Loading stats…" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Employees"
              value={employeeCount !== undefined ? String(employeeCount) : '—'}
              icon={<UsersIcon />}
              accent="bg-brand-500/10 text-brand-400"
            />
            <StatCard
              label="Contract Balance"
              value={fmt(contractBalance)}
              icon={<VaultIcon />}
              accent="bg-emerald-500/10 text-emerald-400"
            />
            <StatCard
              label="Total Promised"
              value={fmt(totalPromised)}
              icon={<TrendingUpIcon />}
              accent={isUnderfunded ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}
              warn={isUnderfunded}
            />
            <StatCard
              label="Your Wallet"
              value={fmt(walletBalance)}
              icon={<WalletIcon />}
              accent="bg-sky-500/10 text-sky-400"
            />
          </div>

          {isUnderfunded && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-4 text-sm text-red-400 flex items-start gap-3">
              <span className="font-bold flex-shrink-0 mt-0.5">!</span>
              <span>
                Pool underfunded — employees are owed{' '}
                <strong className="text-red-300">{fmt(totalPromised)}</strong> but the contract only
                holds <strong className="text-red-300">{fmt(contractBalance)}</strong>. Deposit more
                tokens to prevent failed claim transactions.
              </span>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepositTokensForm />
        <HireEmployeeForm />
      </div>

      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Employees</h2>
        <EmployeeTable />
      </div>
    </div>
  )
}
