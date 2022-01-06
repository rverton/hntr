import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function useAutomationsLibrary() {
  const { data, mutate, error } = useSWR(`/api/automations/library`, fetcher)

  return {
    automationsLibrary: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
