import { createConfig, http } from 'wagmi'
import { foundry, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const rpcUrl = import.meta.env.VITE_RPC_URL ?? 'http://127.0.0.1:8545'

export const wagmiConfig = createConfig({
  chains: [foundry, sepolia],
  connectors: [injected()],
  transports: {
    [foundry.id]: http(rpcUrl),
    [sepolia.id]: http(),
  },
})
