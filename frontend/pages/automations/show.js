import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
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
        console.log('started automation')
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
          <AutomationRunsTable automationId={automation.id} />
        </div>
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
