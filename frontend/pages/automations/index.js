import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useRef, useState } from 'react'
import { useForm } from "react-hook-form";
import { Dialog, Transition } from '@headlessui/react'

import { ChevronRightIcon } from '@heroicons/react/solid'

import Layout from '../../components/layout'
import Tag from '../../components/tagBadge'
import useAutomations from '../../hooks/useAutomations'
import useBox from '../../hooks/useBox'
import useAutomationsLibrary from '../../hooks/useAutomationsLibrary'

import api from '../../lib/api'

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

        <div className="text-center text-gray-500 pt-5">Note: You need to execute the automation worker to process tasks.</div>

      </Layout>

      <AutomationsLibraryModal
        showModal={showLibrary}
        setShowModal={setShowLibrary}
        automations={automations}
        boxId={id}
        automationsMutate={mutate}
      />

      <AutomationsAddModal
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
                      <div className="flex space-x-1">
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
                      <div className="flex space-x-1">
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

function AutomationsLibraryModal({ showModal, setShowModal, boxId, automationsMutate }) {
  const cancelButtonRef = useRef(null)
  const { automationsLibrary } = useAutomationsLibrary()

  const handleImport = (data) => {
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


function AutomationsAddModal({ showModal, setShowModal, box, automationsMutate }) {
  const cancelButtonRef = useRef(null)
  const { register, handleSubmit, formState: { errors } } = useForm();


  const submitHandler = data => {
    data.source_tags = data.source_tags.split(',').filter(t => t)
    data.destination_tags = data.destination_tags.split(',').filter(t => t)

    api.post(`/box/${box.id}/automations`, data)
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="w-full mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                    Add automation to your box
                  </Dialog.Title>
                  <div className="">

                    <form onSubmit={handleSubmit(submitHandler)} className="space-y-8 divide-y divide-gray-200">
                      <div className="space-y-8 divide-y divide-gray-200 sm:space-y-5">

                        <div className="pt-2 space-y-6 sm:space-y-5">
                          <div className="space-y-6 sm:space-y-1">

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Name
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <input
                                  type="text"
                                  {...register("name", { required: true })}
                                  className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                                />
                                {errors.name && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Description
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <textarea
                                  {...register("description", { required: true })}
                                  rows={2}
                                  className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                                  defaultValue={''}
                                />
                                <p className="mt-2 text-sm text-gray-500">Short description of what this automation does.</p>
                                {errors.description && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                            <div className="pt-6">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">Source Data</h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Define which records should be loaded and how they should be filtered
                              </p>
                            </div>

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="country" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Source Container
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <select
                                  {...register("source_container", { required: true })}
                                  className="max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                                >
                                  {box && box.containers?.map(b => <option key={b}>{b}</option>)}
                                </select>
                                {errors.source_container && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Source Tags
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <input
                                  type="text"
                                  {...register("source_tags", { required: false })}
                                  className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                                />
                                <p className="mt-2 text-sm text-gray-500">Separated by a comma</p>
                                {errors.source_tags && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                            <div className="pt-6">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">Destination Data</h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Define where results should be stored and how they should be tagged
                              </p>
                            </div>

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="country" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Destination Container
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <select
                                  {...register("destination_container", { required: true })}
                                  className="max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                                >
                                  {box && box.containers?.map(b => <option key={b}>{b}</option>)}
                                </select>
                                {errors.destination_container && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Destination Tags
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <input
                                  type="text"
                                  {...register("destination_tags", { required: false })}
                                  className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                                />
                                <p className="mt-2 text-sm text-gray-500">Separated by a comma</p>
                                {errors.destination_tags && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                            <div className="pt-6">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">Command</h3>
                              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Specify the command which should be executed
                              </p>
                            </div>

                            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:pt-5">
                              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                                Command
                              </label>
                              <div className="mt-1 sm:mt-0 sm:col-span-2">
                                <textarea
                                  {...register("command", { required: true })}
                                  rows={2}
                                  className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                                  defaultValue={''}
                                  placeholder="echo {data} | subfinder"
                                />
                                <p className="mt-2 text-sm text-gray-500">Use <span className="text-xs font-mono">{'{'}data{'}'}</span> in your command to be replaced by each record. This data will be escaped and quoted.</p>
                                {errors.command && <span className="py-2 text-sm text-red-700">This field is required</span>}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                    </form>

                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex space-x-2 justify-end">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowModal(false)}
                  ref={cancelButtonRef}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-orange-800 text-white text-base font-medium hover:bg-orange-900 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={handleSubmit(submitHandler)}
                >
                  Add Automation
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog >
    </Transition.Root >
  )
}

function InstallWorkerModal({ showModal, setShowModal, box }) {
  const cancelButtonRef = useRef(null)
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                    Install Worker
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-base text-gray-500">
                      To run automations you need to run a worker, which will fetch jobs from your box and submits results.
                      Be aware that this will <span className="font-medium">execute commands from your box</span>. It is advised to run this script in an isolated context like a VM or a container
                    </p>

                    <p className="text-base text-gray-500 py-3">
                      The worker script can be <a href="/worker.sh" className="underline">downloaded here</a>.
                    </p>

                    <div className="font-mono border p-5 text-sm my-3">
                      <span id="curl">./worker.sh {box?.id}</span>
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
  )
}
