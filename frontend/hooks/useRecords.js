import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useRecords(boxId, container, filter, limit, page) {
  const offset = page * limit;
  const { data, mutate, error } = useSWR(boxId ? `/api/box/${boxId}/${container}?term=${filter}&limit=${limit}&offset=${offset}` : null, fetcher)

  return {
    records: data?.records,
    count: data?.count,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
