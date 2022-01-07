import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'

import Layout from '../../components/layout'
import useAutomations from '../../hooks/useAutomations'
import useAutomationEvents from '../../hooks/useAutomationEvents'

import api from '../../lib/api'

export default function AutomationShow() {
  const router = useRouter()
  const { id, aid } = router.query
  const [automation, setAutomation] = useState({})

  const { automations, isLoading, isError } = useAutomations(id)

  const { mutate } = useAutomationEvents(aid)

  const tableMemo = useMemo(() => {
    return <AutomationRunsTable
      automationId={aid}
    />;
  }, [aid])

  useEffect(() => {
    if (!isLoading) {
      const automation = automations.filter(a => a.id === aid)
      if (automation.length > 0) {
        setAutomation(automation[0])
      }
    }
  }, [automations])

  const runAutomation = () => {
    if (automation.source_count <= 0) {
      return alert(`There are 0 records to run this automation on matching {automation.source_container}`)
    }

    api.post(`/automations/${aid}/start`)
      .then(() => {
        mutate()
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

        <div className="h-16 flex items-center border-b px-4 bg-white text-xl justify-between">
          <div>
            <div className="text-xl">Automations: {automation.name}</div>
          </div>


          <div className="flex items-center space-x-4">
            <div className="max-w-2xl text-sm text-gray-500">
              Targeting{' '}
              <Link href={`/${automation.source_container}/?id=${id}`}><a className="text-blue-600">{automation.source_count} entries</a></Link>{' '}
              currently
            </div>
            <button onClick={runAutomation} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm rounded-md text-white bg-gray-600 hover:bg-gray-700 sm:mt-0 sm:w-auto">
              Start Automation
            </button>
          </div>
        </div>

        <div className="p-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Source Table</dt>
              <dd className="mt-1 text-sm text-gray-900">{automation.source_container}</dd>
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
              <dd className="mt-1 text-sm text-gray-900">{automation.destination_container}</dd>
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

        {tableMemo}
      </Layout>
    </>
  )
}

function AutomationRunsTable({ automationId }) {
  const { events, isLoading, isError } = useAutomationEvents(automationId)

  if (isError) return <div>An error occured loading the data.</div>
  if (isLoading) return <div>Loading</div>

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <table className="w-full table-fixed mb-8">
            <thead>
              <tr>
                <th className="w-1/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2 border-l">
                  Status
                </th>
                <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
                  Started
                </th>
                <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
                  Finished
                </th>
                <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
                  Unique Results
                </th>
                <th className="w-7/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2 border-r">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm font-medium text-gray-900">{event.status}</td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(event.created_at), 'yy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm text-gray-500">
                    {event.finished_at.Valid && format(parseISO(event.finished_at.Time), 'yy-MM-dd HH:mm:ss')}
                  </td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm text-gray-500">{event.unique_results}</td>
                  <td className="px-2 py-1 text-sm whitespace-nowrap text-sm text-gray-500">{event.data}</td>
                </tr>
              ))}
              {events && events.length <= 0 && <tr><td colspan="5" className="p-3 text-center">No runs till yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
