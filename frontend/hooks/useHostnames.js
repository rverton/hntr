
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useBox(boxId, filter, limit) {
  const { data, error } = useSWR(boxId ? `/api/box/${boxId}/hostnames?term=${filter}&limit=${limit}` : null, fetcher)

  return {
    hostnames: data?.hostnames,
    count: data?.count,
    isLoading: !error && !data,
    isError: error
  }
}
