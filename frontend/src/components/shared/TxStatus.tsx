interface Props {
  isPending:    boolean
  isConfirming: boolean
  isSuccess:    boolean
  error:        Error | null
  successMsg?:  string
}

export default function TxStatus({ isPending, isConfirming, isSuccess, error, successMsg }: Props) {
  if (isPending)    return <p className="text-sm text-yellow-600 mt-2">Waiting for wallet confirmation…</p>
  if (isConfirming) return <p className="text-sm text-blue-600 mt-2">Transaction submitted, confirming…</p>
  if (isSuccess)    return <p className="text-sm text-green-600 mt-2">{successMsg ?? 'Transaction confirmed!'}</p>
  if (error)        return <p className="text-sm text-red-600 mt-2">{(error as Error).message?.slice(0, 120)}</p>
  return null
}
