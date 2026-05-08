import ConnectWallet from '../shared/ConnectWallet'
import { useEmployer } from '../../hooks/useContractData'

export default function Header() {
  const { data: employer } = useEmployer()
  const companyName = employer ? (employer as unknown as { name: string }).name : 'VentingToken'

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            VT
          </div>
          <span className="text-white font-semibold">{companyName}</span>
        </div>
        <ConnectWallet />
      </div>
    </header>
  )
}
