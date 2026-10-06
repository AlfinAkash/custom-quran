import { useQuery } from '@tanstack/react-query'

export function useFetch(url) {
  const q = useQuery({ queryKey: [url], enabled: !!url, staleTime: 5 * 60_000, queryFn: () => fetch(url).then((r) => r.json()).then((j) => j.data ?? j) })
  return { data: q.data ?? null, error: q.isError, loading: q.isLoading }
}
