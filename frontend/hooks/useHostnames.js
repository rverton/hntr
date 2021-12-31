
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useBox(boxId, filter) {
  const { data, error } = useSWR(boxId ? `/api/box/${boxId}/hostnames?term=${filter}` : null, fetcher)

  return {
    hostnames: data,
    isLoading: !error && !data,
    isError: error
  }
}
