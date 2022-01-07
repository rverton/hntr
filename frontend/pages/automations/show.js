import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'

import Layout from '../../components/layout'
import LimitSelect from '../../components/limitSelect'

import useAutomations from '../../hooks/useAutomations'
import useAutomationEvents from '../../hooks/useAutomationEvents'

import api from '../../lib/api'

const LIMIT = 500

export default function AutomationShow() {
  const router = useRouter()
  const { id, aid } = router.query
  const [automation, setAutomation] = useState({})
  const [disabled, setDisabled] = useState(false);

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
    setDisabled(true);
    setTimeout(() => {
      setDisabled(false);
    }, 5000);

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
            <button
              onClick={runAutomation}
              disabled={disabled}
              className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 disabled:bg-gray-300 disabled:hover:bg-gray-300 tracking-widest text-xs border border-transparent shadow-sm rounded-md text-white bg-gray-600 hover:bg-gray-700 sm:mt-0 sm:w-auto">
              Start Automation
            </button>
          </div>
        </div>

        <div className="px-5 py-6 space-y-1 text-sm bg-gray-50">

          <div className="flex">
            <div className="w-32 font-medium">Source:</div>
            <span className="px-1 font-mono text-sm bg-gray-200 rounded mr-1">{automation.source_container}</span>
            filtered by
            <span className="px-1 font-mono text-sm bg-gray-200 rounded ml-1">
              {automation.source_tags}
              {automation?.source_tag?.length <= 0 && <>No tags</>}
            </span>
          </div>

          <div className="flex">
            <div className="w-32 font-medium text-sm">Destination:</div>
            <span className="px-1 font-mono text-sm bg-gray-200 rounded mr-1">{automation.destination_container}</span>
            adding tags
            <span className="px-1 font-mono text-sm bg-gray-200 rounded ml-1">
              {automation.destination_tags}
              {automation?.destination_tags?.length <= 0 && <>No tags</>}
            </span>
          </div>

          <div className="flex">
            <div className="w-32 font-medium text-sm">Command:</div>
            <span className="px-1 font-mono">{automation.command}</span>
          </div>

        </div>

        {tableMemo}
      </Layout>
    </>
  )
}

function AutomationRunsTable({ automationId }) {
  const [limit, setLimit] = useState(LIMIT)

  const { events, isLoading, isError } = useAutomationEvents(automationId, limit)

  if (isError) return <div>An error occured loading the data.</div>
  if (isLoading) return <div>Loading</div>

  return (
    <>

      <div className="flex items-center justify-end space-x-2 text-sm bg-gray-50 pr-5 py-2 border-t border-gray-300 border-dashed">
        <div className="text-sm text-gray-500">
          {events.length} log events
        </div>
        <LimitSelect limit={limit} setLimit={setLimit} />
      </div>

      <div className="flex flex-col">
        <div className="w-full">
          <div className="align-middle inline-block">
            <table className="w-full table-fixed mb-8">
              <thead>
                <tr>
                  <th className="w-1/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
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
                  <th className="w-7/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
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
    </>
  )
}
