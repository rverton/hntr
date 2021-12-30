import Head from 'next/head'
import { useRouter } from 'next/router'

import { useState, useEffect } from 'react'

import Layout from '../../components/layout'
import useAutomations from '../../hooks/useAutomations'

import api from '../../lib/api'

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

  const runAutomation = (aid) => {
    api.post(`/automations/${aid}/start`)
      .then(resp => {
        alert('started')
      })
      .catch(err => {
        console.error(err);
        alert('Error. Please try again later')
      })
  }

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <h2 className="text-xl">Automation {automation.name}</h2>

        <div className="mt-4">
          <button onClick={() => runAutomation(automation.id)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 uppercase tracking-widest text-xs font-semibold border border-transparent shadow-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 sm:mt-0 sm:ml-3 sm:w-auto">
            Start
          </button>
        </div>

      </Layout>

    </>
  )
}
