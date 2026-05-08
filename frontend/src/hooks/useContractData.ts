import { useReadContract, useReadContracts } from 'wagmi'
import type { Address } from 'viem'
import { VENTING_TOKEN_ABI } from '../abi/VentingToken'
import { VENTING_ERC20_ABI } from '../abi/VentingERC20'
import { VENTING_TOKEN_ADDRESS, VENTING_ERC20_ADDRESS, POLL_INTERVAL_MS } from '../lib/contracts'

// ── Owner / employer info ────────────────────────────────────────────────────

export function useOwner() {
  return useReadContract({
    address: VENTING_TOKEN_ADDRESS,
    abi: VENTING_TOKEN_ABI,
    functionName: 'i_owner',
    query: { refetchInterval: POLL_INTERVAL_MS },
  })
}

export function useEmployer() {
  return useReadContract({
    address: VENTING_TOKEN_ADDRESS,
    abi: VENTING_TOKEN_ABI,
    functionName: 's_employer',
    query: { refetchInterval: POLL_INTERVAL_MS },
  })
}

// ── Token balances ───────────────────────────────────────────────────────────

export function useContractBalance() {
  return useReadContract({
    address: VENTING_TOKEN_ADDRESS,
    abi: VENTING_TOKEN_ABI,
    functionName: 'getContractBalance',
    query: { refetchInterval: POLL_INTERVAL_MS },
  })
}

export function useTokenBalance(address: Address | undefined) {
  return useReadContract({
    address: VENTING_ERC20_ADDRESS,
    abi: VENTING_ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: POLL_INTERVAL_MS },
  })
}

export function useTokenAllowance(owner: Address | undefined) {
  return useReadContract({
    address: VENTING_ERC20_ADDRESS,
    abi: VENTING_ERC20_ABI,
    functionName: 'allowance',
    args: owner ? [owner, VENTING_TOKEN_ADDRESS] : undefined,
    query: { enabled: !!owner, refetchInterval: POLL_INTERVAL_MS },
  })
}

export function useTokenSymbol() {
  return useReadContract({
    address: VENTING_ERC20_ADDRESS,
    abi: VENTING_ERC20_ABI,
    functionName: 'symbol',
  })
}

// ── Employee list (bulk) ─────────────────────────────────────────────────────

export function useAllEmployeeData() {
  return useReadContract({
    address: VENTING_TOKEN_ADDRESS,
    abi: VENTING_TOKEN_ABI,
    functionName: 'getAllEmployeeData',
    query: { refetchInterval: POLL_INTERVAL_MS },
  })
}

// ── Single-employee vesting status ──────────────────────────────────────────

export function useVestingStatus(employeeAddress: Address | undefined) {
  return useReadContract({
    address: VENTING_TOKEN_ADDRESS,
    abi: VENTING_TOKEN_ABI,
    functionName: 'getVestingStatus',
    args: employeeAddress ? [employeeAddress] : undefined,
    query: { enabled: !!employeeAddress, refetchInterval: POLL_INTERVAL_MS },
  })
}

export function useEmployeeRecord(employeeAddress: Address | undefined) {
  return useReadContract({
    address: VENTING_TOKEN_ADDRESS,
    abi: VENTING_TOKEN_ABI,
    functionName: 'employees',
    args: employeeAddress ? [employeeAddress] : undefined,
    query: { enabled: !!employeeAddress, refetchInterval: POLL_INTERVAL_MS },
  })
}

// ── Employer dashboard stats ─────────────────────────────────────────────────

export function useEmployerStats(ownerAddress: Address | undefined) {
  return useReadContracts({
    contracts: [
      {
        address: VENTING_TOKEN_ADDRESS,
        abi: VENTING_TOKEN_ABI,
        functionName: 'getContractBalance',
      },
      {
        address: VENTING_TOKEN_ADDRESS,
        abi: VENTING_TOKEN_ABI,
        functionName: 's_employeeCount',
      },
      {
        address: VENTING_ERC20_ADDRESS,
        abi: VENTING_ERC20_ABI,
        functionName: 'balanceOf',
        args: ownerAddress ? [ownerAddress] : ['0x0000000000000000000000000000000000000000'],
      },
    ],
    query: { enabled: !!ownerAddress, refetchInterval: POLL_INTERVAL_MS },
  })
}
