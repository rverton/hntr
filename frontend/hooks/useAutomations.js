import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useBox(boxId) {
  const { data, error } = useSWR(boxId ? `/api/box/${boxId}/automations` : null, fetcher)

  return {
    automations: data,
    isLoading: !error && !data,
    isError: error
  }
}
