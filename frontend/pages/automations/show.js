import Head from 'next/head'
import { useRouter } from 'next/router'

import { useState, useEffect } from 'react'

import Layout from '../../components/layout'
import useAutomations from '../../hooks/useAutomations'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export default function Home() {
  const router = useRouter()
  const { id, aid } = router.query
  const [automation, setAutomation] = useState({})

  const { automations, isLoading, isError } = useAutomations(id)

  useEffect(() => {
    if (!isLoading) {
      console.log(automations, aid)
      const automation = automations.filter(a => a.id === aid)
      if (automation.length > 0) {
        setAutomation(automation[0])
      }
    }
  }, [automations])

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <h2 className="text-xl">Automation {automation.name}</h2>

        <div className="mt-4">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {id}, {aid}
          </div>
        </div>

      </Layout>

    </>
  )
}
