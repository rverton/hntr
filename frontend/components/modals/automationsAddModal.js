import { useForm } from 'react-hook-form'
import { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import api from '../../lib/api'

export default function AutomationsAddModal({ showModal, setShowModal, box, automationsMutate }) {
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

