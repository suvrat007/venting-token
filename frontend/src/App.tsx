import { lazy, Suspense } from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useOwner, useEmployeeRecord } from './hooks/useContractData'
import Header from './components/layout/Header'
import LoadingSpinner from './components/shared/LoadingSpinner'
import ConnectWallet from './components/shared/ConnectWallet'

// Lazy-loaded route-level components — each chunk is only downloaded when needed
const EmployerDashboard = lazy(() => import('./components/employer/EmployerDashboard'))
const EmployeeDashboard = lazy(() => import('./components/employee/EmployeeDashboard'))

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
    <div className="flex flex-col items-center justify-center py-32 gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
        VT
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VentingToken</h1>
        <p className="text-gray-500 mt-2 max-w-sm">
          Employee token vesting on-chain. Connect your wallet to get started.
        </p>
      </div>
      <ConnectWallet />
    </div>
  )
}

function UnknownUser() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-gray-700">Not Recognised</h2>
      <p className="text-gray-400 max-w-sm text-sm">
        Your wallet is not the contract owner and is not registered as an employee.
        Ask your employer to hire your address.
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
