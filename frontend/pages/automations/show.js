import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useState, useRef, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useForm } from "react-hook-form";
import { Dialog, Transition } from '@headlessui/react'

import Layout from '../../components/layout'
import LimitSelect from '../../components/limitSelect'

import useAutomations from '../../hooks/useAutomations'
import useAutomationEvents from '../../hooks/useAutomationEvents'
import useBox from '../../hooks/useBox'

import api from '../../lib/api'

const LIMIT = 500

export default function AutomationShow() {
  const router = useRouter()
  const { id, aid } = router.query
  const [automation, setAutomation] = useState({})
  const [disabled, setDisabled] = useState(false);

  const [showEdit, setShowEdit] = useState(false)

  const { automations, mutate: mutateAutomations, isLoading, isError } = useAutomations(id)
  const { box } = useBox(id)

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
  }, [automations, aid])

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

  const removeAutomation = () => {
    if (!confirm("Are you sure to remove to automation and all associated runs?")) return;

    api.delete(`/automations/${aid}`)
      .then(() => {
        router.push(`/automations/?id=${id}`)
      })
      .catch(err => {
        console.error(err);
        alert('Error. Please try again later')
      })
  }

  if (isError) return <div>An error occured loading the data.</div>
  if (isLoading) return <div>Loading</div>

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
              <Link href={`/records/?id=${automation.box_id}&container=${automation.source_container}&term=${automation.source_tags?.map(t => `tag:${t}`).join(' ')}`}><a className="text-blue-600">{automation.source_count} entries</a></Link>{' '}
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
              {automation.source_tags?.join(' ')}
              {automation.source_tags?.length == 0 && <>No tags</>}
            </span>
          </div>

          <div className="flex">
            <div className="w-32 font-medium text-sm">Destination:</div>
            <span className="px-1 font-mono text-sm bg-gray-200 rounded mr-1">{automation.destination_container}</span>
            adding tags
            <span className="px-1 font-mono text-sm bg-gray-200 rounded ml-1">
              {automation.destination_tags?.join(' ')}
              {automation.destination_tags?.length <= 0 && <>No tags</>}
            </span>
          </div>

          <div className="flex">
            <div className="w-32 font-medium text-sm">Command:</div>
            <span className="px-1 font-mono">{automation.command}</span>
          </div>

          <div className="pt-3 flex space-x-3">
            <a onClick={() => setShowEdit(true)} href="#" className="font-medium underline decoration-dotted">Edit automation</a>
            <a onClick={removeAutomation} href="#" className="font-medium underline decoration-dotted">Remove automation</a>
          </div>

        </div>

        {tableMemo}

        <AutomationsEdit
          showModal={showEdit}
          setShowModal={setShowEdit}
          automation={automation}
          box={box}
          mutate={mutateAutomations}
        />
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
          {events.length} events
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
                    Added/Changed
                  </th>
                  <th className="w-7/12 text-sm bg-gray-100 text-gray-700 font-medium border-b border-t border-gray-200 text-left py-1 px-2">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900">{event.status}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(event.created_at), 'yy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">
                      {event.finished_at.Valid && format(parseISO(event.finished_at.Time), 'yy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">{event.affected_rows}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-500">{event.data}</td>
                  </tr>
                ))}
                {events && events.length <= 0 && <tr><td colSpan="5" className="p-3 text-center">No runs till yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function AutomationsEdit({ showModal, setShowModal, box, automation, mutate }) {
  const cancelButtonRef = useRef(null)
  const { register, reset, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const defaultValues = {
      name: automation.name,
      description: automation.description,
      command: automation.command,
      source_tags: automation.source_tags?.join(','),
      destination_tags: automation.destination_tags?.join(','),
      source_container: automation.source_container,
      destination_container: automation.destination_container,
    }
    reset(defaultValues)
  }, [automation])


  const submitHandler = data => {
    data.source_tags = data.source_tags.split(',').filter(t => t)
    data.destination_tags = data.destination_tags.split(',').filter(t => t)

    api.put(`/automations/${automation.id}`, data)
      .then(() => {
        mutate()
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
                    Edit Automation
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
                                  {box && box.containers?.map(b => <option key={b} selected={b == automation.source_container}>{b}</option>)}
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
                                  {box && box.containers?.map(b => <option key={b} selected={b == automation.destination_container}>{b}</option>)}
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
                  Save Automation
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog >
    </Transition.Root >
  )
}

