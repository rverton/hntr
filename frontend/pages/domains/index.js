import Head from 'next/head'
import { useRouter } from 'next/router'
import { formatDistanceToNow, parseISO } from 'date-fns'

import { Fragment, useRef, useState, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import Layout from '../../components/layout'
import useDomains from '../../hooks/useDomains'

export default function Home() {
  const router = useRouter()
  const { id } = router.query

  const [showModal, setShowModal] = useState(false)
  const [filterInput, setFilterInput] = useState("")
  const [filter, setFilter] = useState("")
  const cancelButtonRef = useRef(null)
  const { domains, isLoading, isError } = useDomains(id, filter)

  const tableMemo = useMemo(() => <DomainsTable data={domains} isLoading={isLoading} />, [domains, isLoading]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  function handleSubmit(e) {
    if (e.key == 'Enter') {
      setFilter(filterInput)
    }
  }

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <div>
          <div className="flex justify-between items-center">
            <div className="flex w-full sm:max-w-md items-center">
              <input
                minLength={2}
                autoFocus
                type="text"
                name="filter"
                id="filter"
                className="shadow-sm focus:ring-gray-500 focus:border-gray-500 block w-2/3 text-xs border-gray-300 rounded-md"
                placeholder="foo.com tag:is_scope"
                autoComplete=""
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                onKeyDown={handleSubmit}
              />
              {domains && <div className="w-1/3 ml-4 text-sm">{domains.length} hosts</div>}
              {isLoading && <div className="w-1/3 ml-4 text-sm">Loading</div>}
            </div>
            <button onClick={() => setShowModal(true)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 uppercase tracking-widest text-xs font-semibold border border-transparent shadow-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 sm:mt-0 sm:ml-3 sm:w-auto">
              Import
            </button>
          </div>
        </div>

        {isError && <div class="text-red-500">Error loading domains.</div>}
        {!isError && tableMemo}

      </Layout>

      <Transition.Root show={showModal} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" initialFocus={cancelButtonRef} onClose={() => setShowModal(!showModal)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                      Import Domains
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You can use the following command to pipe domains directly into your box:
                      </p>

                      <div className="font-mono border p-5 text-sm my-3">
                        <span className="text-gray-400">cat domains.txt | </span><span id="curl">curl --data-binary @- "{apiUrl}/box/{id}/domains"</span>
                      </div>

                      <p className="text-sm text-gray-500">
                        If you want to add tags, just append it as a parameter:
                      </p>

                      <div className="font-mono border p-5 text-sm my-3">
                        <span className="text-gray-400">echo example.com | </span>curl --data-binary @- "{apiUrl}/box/{id}/domains?tags=is_scope"
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowModal(false)}
                    ref={cancelButtonRef}
                  >
                    Close
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}

function DomainsTable({ data }) {
  return (
    <>
      <table className="mt-8 w-full table-fixed mb-8">
        <thead>
          <tr>
            <th className="w-4/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2 border-l">
              DNS Name
            </th>
            <th className="w-4/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
              Tags
            </th>
            <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
              Source
            </th>
            <th className="w-2/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2 border-r">
              Added
            </th>
          </tr>
        </thead>

        {data?.length > 0 &&
          <tbody>
            {data.map(hostname =>
              <tr key={hostname.hostname}>
                <td
                  className="text-sm px-2 py-1 border-b border-gray-200 border-dashed"
                // onClick={() => { navigator.clipboard.writeText(hostname.hostname) }}
                >{hostname.hostname}</td>
                <td className="flex space-x-1 text-sm px-2 py-1 border-b border-gray-200 border-dashed">
                  {hostname.tags?.map((tag, i) =>
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  )}
                  &nbsp;
                </td>
                <td className="text-sm py-1 px-2 border-b border-gray-200 border-dashed">{hostname.source}</td>
                <td className="text-sm py-1 px-2 border-b border-gray-200 border-dashed">{formatDistanceToNow(
                  parseISO(hostname.created_at)
                )}</td>
              </tr>
            )}
          </tbody>
        }

      </table>

      {
        !data &&
        <div className="text-center text-lg text-bold p-3">Loading</div>
      }

      {
        data && !data.length &&
        <div className="text-center text-lg text-bold p-3">No hostnames added. Please use the import function.</div>
      }

    </>
  )
}

