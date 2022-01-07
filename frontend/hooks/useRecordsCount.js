import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useRecordsCount(boxId) {
  const { data } = useSWR(boxId ? `/api/box/${boxId}/_count` : null, fetcher)

  return {
    count: data?.count || 0,
    limit: data?.limit || 0
  }
}
