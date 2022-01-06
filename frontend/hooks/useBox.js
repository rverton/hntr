import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => {
  if (res.status === 404) throw Error('404');
  return res.json()
})

export default function useBox(id) {
  const { data, error, mutate } = useSWR(id ? `/api/box/${id}` : null, fetcher)

  return {
    box: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
