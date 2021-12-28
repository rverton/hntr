import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useBox(id) {
  const { data, error } = useSWR(id ? `/api/box/${id}` : null, fetcher)

  return {
    box: data,
    isLoading: !error && !data,
    isError: error
  }
}
