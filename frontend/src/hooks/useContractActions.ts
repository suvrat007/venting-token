import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import type { Address } from 'viem'
import { VENTING_TOKEN_ABI } from '../abi/VentingToken'
import { VENTING_ERC20_ABI } from '../abi/VentingERC20'
import { VENTING_TOKEN_ADDRESS, VENTING_ERC20_ADDRESS } from '../lib/contracts'

function useTxLifecycle() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  return { writeContract, hash, isPending, isConfirming, isSuccess, error }
}

// ── ERC20 approve ────────────────────────────────────────────────────────────

export function useApprove() {
  const { writeContract, hash, isPending, isConfirming, isSuccess, error } = useTxLifecycle()

  const approve = (amount: bigint) =>
    writeContract({
      address: VENTING_ERC20_ADDRESS,
      abi: VENTING_ERC20_ABI,
      functionName: 'approve',
      args: [VENTING_TOKEN_ADDRESS, amount],
    })

  return { approve, hash, isPending, isConfirming, isSuccess, error }
}

// ── depositTokens ─────────────────────────────────────────────────────────────

export function useDepositTokens() {
  const { writeContract, hash, isPending, isConfirming, isSuccess, error } = useTxLifecycle()

  const deposit = (amount: bigint) =>
    writeContract({
      address: VENTING_TOKEN_ADDRESS,
      abi: VENTING_TOKEN_ABI,
      functionName: 'depositTokens',
      args: [amount],
    })

  return { deposit, hash, isPending, isConfirming, isSuccess, error }
}

// ── hireEmployee ─────────────────────────────────────────────────────────────

export function useHireEmployee() {
  const { writeContract, hash, isPending, isConfirming, isSuccess, error } = useTxLifecycle()

  const hire = (
    employeeAddress: Address,
    name: string,
    totalTokens: bigint,
    joiningToken: bigint,
  ) =>
    writeContract({
      address: VENTING_TOKEN_ADDRESS,
      abi: VENTING_TOKEN_ABI,
      functionName: 'hireEmployee',
      args: [employeeAddress, name, totalTokens, joiningToken],
    })

  return { hire, hash, isPending, isConfirming, isSuccess, error }
}

// ── fireEmployee ─────────────────────────────────────────────────────────────

export function useFireEmployee() {
  const { writeContract, hash, isPending, isConfirming, isSuccess, error } = useTxLifecycle()

  const fire = (employeeAddress: Address) =>
    writeContract({
      address: VENTING_TOKEN_ADDRESS,
      abi: VENTING_TOKEN_ABI,
      functionName: 'fireEmployee',
      args: [employeeAddress],
    })

  return { fire, hash, isPending, isConfirming, isSuccess, error }
}

// ── setVestingSchedule ────────────────────────────────────────────────────────

export function useSetVestingSchedule() {
  const { writeContract, hash, isPending, isConfirming, isSuccess, error } = useTxLifecycle()

  const setSchedule = (
    employeeAddress: Address,
    durations: bigint[],
    percentages: bigint[],
  ) =>
    writeContract({
      address: VENTING_TOKEN_ADDRESS,
      abi: VENTING_TOKEN_ABI,
      functionName: 'setVestingSchedule',
      args: [employeeAddress, durations, percentages],
    })

  return { setSchedule, hash, isPending, isConfirming, isSuccess, error }
}

// ── claimVestedTokens ─────────────────────────────────────────────────────────

export function useClaimVestedTokens() {
  const { writeContract, hash, isPending, isConfirming, isSuccess, error } = useTxLifecycle()

  const claim = () =>
    writeContract({
      address: VENTING_TOKEN_ADDRESS,
      abi: VENTING_TOKEN_ABI,
      functionName: 'claimVestedTokens',
    })

  return { claim, hash, isPending, isConfirming, isSuccess, error }
}
