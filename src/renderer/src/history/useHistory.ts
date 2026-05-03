import { useEffect } from 'react'
import { useHistoryStore } from './historyStore'

export function useHistory() {
  const { load, from, to } = useHistoryStore()

  useEffect(() => {
    load(from, to)
  }, [load, from, to])

  return useHistoryStore()
}
