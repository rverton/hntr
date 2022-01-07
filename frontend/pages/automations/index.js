import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import { ChevronRightIcon } from '@heroicons/react/solid'

import Layout from '../../components/layout'
import Tag from '../../components/tagBadge'
import useAutomations from '../../hooks/useAutomations'
import useAutomationsLibrary from '../../hooks/useAutomationsLibrary'

import api from '../../lib/api'

export default function AutomationsIndex() {
  const router = useRouter()
  const { id } = router.query

  const [showLibrary, setShowLibrary] = useState(false)

  const { automations, mutate, isLoading, isError } = useAutomations(id)

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <div className="h-16 flex items-center border-b px-4 bg-white text-xl justify-between">
          <div className="text-xl">Automations</div>


          <div className="flex space-x-2">
            <button onClick={() => setShowLibrary(!showLibrary)} type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm border border-gray-300 font-medium rounded-md hover:bg-gray-100 sm:mt-0 sm:ml-3 sm:w-auto">
              Library
            </button>
            <button type="submit" className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm rounded-md text-white bg-orange-800 hover:bg-orange-900 sm:mt-0 sm:ml-3 sm:w-auto">
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
                <AutomationRow
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

      </Layout>

      <AutomationsLibraryModal
        showModal={showLibrary}
        setShowModal={setShowLibrary}
        automations={automations}
        boxId={id}
        automationsMutate={mutate}
      />

    </>
  )
}

function AutomationsLibraryModal({ showModal, setShowModal, boxId, automationsMutate }) {
  const cancelButtonRef = useRef(null)
  const { automationsLibrary } = useAutomationsLibrary()

  const handleImport = (data) => {
    console.log({ data })
    api.post(`/box/${boxId}/automations`, data)
      .then(() => {
        automationsMutate()
        setShowModal(false)
      })
      .catch(err => {
        console.error(err);
        alert('Error. Please try again later')
      })
  }

  return (
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
                <div className="mt-3 w-full text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                    Automation Library
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You can select one of the following automations to import them directly into your box:
                    </p>

                    <ul role="list" className="shadow border rounded-sm divide-y divide-gray-200 mt-5">
                      {automationsLibrary && automationsLibrary.map((automation) => (
                        <AutomationRow
                          key={automation.id}
                          automation={automation}
                          handler={() => handleImport(automation)}
                          importTo={boxId} />
                      ))}
                      {automationsLibrary && !automationsLibrary.length && <div className="p-6">
                        There are no public automations currently.
                      </div>
                      }
                    </ul>

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
  )
}

function AutomationRow({ automation, linkTo, handler }) {

  function Wrapper({ children }) {
    if (linkTo) return <Link href={linkTo}>{children}</Link>

    return <div onClick={handler}>{children}</div>
  }

  return (
    <li key={automation.id}>
      <Wrapper>
        <a className="cursor-pointer block hover:bg-gray-50">
          <div className="flex items-center px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1 flex items-center">
              <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-3 md:gap-4">
                <div>
                  <p className="text-sm font-medium text-orange-800 truncate">{automation.name}</p>
                  <p className="mt-2 flex flex-col text-sm text-gray-500">
                    <span className="truncate">{automation.command}</span>
                  </p>
                </div>
                <div className="hidden md:block">
                  <div>
                    <p className="text-sm text-gray-900">
                      From <span className="font-bold">{automation.source_container}</span>
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div>
                        {automation.source_tags.map(t => <Tag key={t} name={t} />)}
                        {automation.source_tags.length == 0 && <div>All tags</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div>
                    <p className="text-sm text-gray-900">
                      To <span className="font-bold">{automation.destination_container}</span>
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div>
                        {automation.destination_tags.map(t => <Tag key={t} name={t} />)}
                        {automation.destination_tags.length == 0 && <div>No tags</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          </div>

          <p className="px-10 pt-2 pb-4 flex text-sm text-gray-500">
            <span className="truncate">{automation.description || "No description set."}</span>
          </p>
        </a>
      </Wrapper>
    </li>
  )
}

