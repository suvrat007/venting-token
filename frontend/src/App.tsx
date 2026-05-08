import { lazy, Suspense } from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useOwner, useEmployeeRecord } from './hooks/useContractData'
import Header from './components/layout/Header'
import LoadingSpinner from './components/shared/LoadingSpinner'
import ConnectWallet from './components/shared/ConnectWallet'

const EmployerDashboard = lazy(() => import('./components/employer/EmployerDashboard'))
const EmployeeDashboard = lazy(() => import('./components/employee/EmployeeDashboard'))

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-32">
              <LoadingSpinner size="lg" label="Loading…" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  )
}

function NotConnected() {
  return (
    <div className="relative flex flex-col items-center justify-center py-32 gap-8 px-4 text-center overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-brand-600/10 blur-[120px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-brand-950/50">
          VT
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">VentingToken</h1>
          <p className="text-zinc-400 mt-3 max-w-sm text-base leading-relaxed">
            On-chain employee token vesting. Trustless, transparent, and automated.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <ConnectWallet />
          <p className="text-xs text-zinc-600">Connect your wallet to continue</p>
        </div>
      </div>
    </div>
  )
}

function UnknownUser() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xl">?</div>
      <h2 className="text-lg font-semibold text-white">Not Recognised</h2>
      <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
        Your wallet is not the contract owner and is not registered as an employee.
        Ask your employer to add your address.
      </p>
    </div>
  )
}

function AppRoutes() {
  const { address, isConnected } = useAccount()

  const { data: owner, isLoading: ownerLoading }  = useOwner()
  const { data: empRecord, isLoading: empLoading } = useEmployeeRecord(
    isConnected ? (address as Address) : undefined,
  )

  if (!isConnected) return <NotConnected />

  if (ownerLoading || empLoading) {
    return (
      <div className="flex justify-center py-32">
        <LoadingSpinner size="lg" label="Checking access…" />
      </div>
    )
  }

  const isOwner = owner && address && (owner as string).toLowerCase() === address.toLowerCase()

  const empAddress = (empRecord as unknown as { employeeAddress?: string } | undefined)?.employeeAddress
  const isEmployee = empAddress && empAddress !== '0x0000000000000000000000000000000000000000'

  if (isOwner)    return <EmployerDashboard />
  if (isEmployee) return <EmployeeDashboard />
  return <UnknownUser />
}

export default function App() {
  return (
    <PageShell>
      <AppRoutes />
    </PageShell>
  )
}
