import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { ChevronRightIcon } from '@heroicons/react/solid'
import Layout from '../../components/layout'
import useAutomations from '../../hooks/useAutomations'
import useBox from '../../hooks/useBox'
import AutomationsRow from '../../components/automationsRow'
import InstallWorkerModal from '../../components/modals/automationsInstallWorkerModal'
import LibraryModal from '../../components/modals/automationsLibraryModal'
import AddModal from '../../components/modals/automationsAddModal'

export default function AutomationsIndex() {
  const router = useRouter()
  const { id } = router.query

  const [showLibrary, setShowLibrary] = useState(false)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const { automations, mutate, isLoading, isError } = useAutomations(id)
  const { box } = useBox(id)

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <div className="h-16 flex items-center border-b px-4 bg-white text-xl justify-between">
          <div className="text-xl">Automations</div>


          <div className="flex space-x-2">
            <button onClick={() => setShowLibrary(true)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm border border-gray-300 font-medium rounded-md hover:bg-gray-100 sm:mt-0 sm:ml-3 sm:w-auto">
              Library
            </button>

            <button onClick={() => setShowWorkerModal(true)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm border border-gray-300 font-medium rounded-md hover:bg-gray-100 sm:mt-0 sm:ml-3 sm:w-auto">
              Install Worker
            </button>
            <button onClick={() => setShowAdd(true)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm rounded-md text-white bg-orange-800 hover:bg-orange-900 sm:mt-0 sm:ml-3 sm:w-auto">
              Add
            </button>
          </div>
        </div>

        {isLoading && <div>Loading</div>}
        {isError && <div>An error occured loading automations</div>}

        <div className="p-4">
          <div className="bg-white shadow border overflow-hidden rounded-sm">
            <ul role="list" className="divide-y divide-gray-200">
              {automations && automations.map((automation) => (
                <AutomationsRow
                  key={automation.id}
                  automation={automation}
                  linkTo={`/automations/show?id=${id}&aid=${automation.id}`}
                />
              ))}
              {automations && !automations.length && <div className="p-6">
                You have not setup any automations yet.
              </div>
              }
            </ul>
          </div>
        </div>

        <div className="text-center text-gray-500 pt-5">Note: You need to execute the automation worker to process tasks.</div>

      </Layout>

      <LibraryModal
        showModal={showLibrary}
        setShowModal={setShowLibrary}
        automations={automations}
        boxId={id}
        automationsMutate={mutate}
      />

      <AddModal
        showModal={showAdd}
        setShowModal={setShowAdd}
        box={box}
        automationsMutate={mutate}
      />

      <InstallWorkerModal
        box={box}
        showModal={showWorkerModal}
        setShowModal={setShowWorkerModal}
      />

    </>
  )
}

