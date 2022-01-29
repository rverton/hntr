import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useAutomationEventCounts(boxId) {
  const { data, mutate, error } = useSWR(boxId ? `/api/box/${boxId}/_counts` : null, fetcher, { refreshInterval: 10000 })

  return {
    counts: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
