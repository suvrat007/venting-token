import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useInvalidateOnSuccess(isSuccess: boolean) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries()
    }
  }, [isSuccess, queryClient])
}
