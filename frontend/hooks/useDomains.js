
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useBox(boxId, filter) {
  const { data, error } = useSWR(boxId ? `/api/box/${boxId}/domains?term=${filter}` : null, fetcher)

  return {
    domains: data,
    isLoading: !error && !data,
    isError: error
  }
}
