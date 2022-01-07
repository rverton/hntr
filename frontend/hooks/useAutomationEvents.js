
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useAutomationEvents(automationId, limit) {
  if (!limit) limit = 500;
  const { data, mutate, error } = useSWR(automationId ? `/api/automations/${automationId}/events?limit=${limit}` : null, fetcher, { refreshInterval: 10000 })

  return {
    events: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
