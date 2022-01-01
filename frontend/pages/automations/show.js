import Link from 'next/link'
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

  const runAutomation = async (aid) => {
    api.post(`/automations/${aid}/start`)
      .then(() => {
        console.log('started')
      })
      .catch(err => {
        console.error(err);
        alert('Error. Please try again later')
      })
  }

  if (isError) return <div>An error occured loading the data.</div>

  return (
    <>
      <Layout>
        <div className="flex justify-between">
          <div className="pb-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Automation {automation.name}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Targeting{' '}
              <Link href={`/${automation.source_table}/?id=${id}`}><a className="text-blue-600">{automation.source_count} entries</a></Link>{' '}
              currently
            </p>
          </div>
          <div className="flex items-center">
            <button onClick={() => runAutomation(automation.id)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 uppercase tracking-widest text-xs font-semibold border border-transparent shadow-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 sm:mt-0 sm:w-auto">
              Start Job
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Source Table</dt>
              <dd className="mt-1 text-sm text-gray-900">{automation.source_table}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Source Tags</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {automation.source_tags}
                {!automation.source_tags?.length && <span>No tags</span>}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Destination Table</dt>
              <dd className="mt-1 text-sm text-gray-900">{automation.destination_table}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Destionation Tags</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {automation.destination_tags}
                {!automation.destination_tags?.length && <span>No tags</span>}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Command</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="font-mono text-sm">{automation.command}</div>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5">
          <h3 className="mb-5 text-lg leading-6 font-medium text-gray-900">Recent runs</h3>
          <AutomationRunsTable />
        </div>
      </Layout>
    </>
  )
}

function AutomationRunsTable() {


  /* This example requires Tailwind CSS v2.0+ */
  const people = [
    { name: 'Jane Cooper', title: 'Regional Paradigm Technician', role: 'Admin', email: 'jane.cooper@example.com' },
    // More people...
  ]

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <table className="w-full table-fixed mb-8">
            <thead>
              <tr>
                <th className="w-4/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2 border-l">
                  Date
                </th>
                <th className="w-4/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
                  Status
                </th>
                <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
                  Unique results
                </th>
                <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2 border-r">

                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {people.map((person) => (
                <tr key={person.email}>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm font-medium text-gray-900">{person.name}</td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm text-gray-500">192</td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm text-gray-500">Success</td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-indigo-600 hover:text-indigo-900">
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
