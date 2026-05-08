import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300 font-mono">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      {connectors.map((c) => (
        <button
          key={c.uid}
          onClick={() => connect({ connector: c })}
          className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          Connect {c.name}
        </button>
      ))}
    </div>
  )
}
