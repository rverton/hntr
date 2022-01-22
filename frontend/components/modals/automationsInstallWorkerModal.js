import { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'

export default function AutomationsInstallWorkerModal({ showModal, setShowModal, box }) {
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
                  <div className="mt-2 space-y-8">
                    <p className="text-base text-gray-500">
                      To run automations you need to run a worker, which will fetch jobs from your box and submits results.
                      Be aware that this will <span className="font-medium">execute commands from your box</span>. It is advised to run this script in an isolated context like a VM or a container.
                    </p>

                    <div>
                      <h3 className="font-semibold">Run without isolation:</h3>
                      <div className="font-mono border p-5 text-sm my-3">
                        <div>wget https://hntr.unlink.io/worker.sh</div>
                        <div>chmod +x worker.sh</div>
                        <div>./worker.sh {box?.id}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold">Run in Docker container:</h3>
                      <div className="font-mono border p-5 text-sm my-3">
                        <div>wget https://hntr.unlink.io/Dockerfile</div>
                        <div className="text-gray-500">vim Dockerfile # add needed automation tools</div>
                        <div>docker build -t hntr-runner .</div>
                        <div>docker run --rm -it hntr-runner {box?.id}</div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Modify the Dockerfile and add all tools you need in your automations.
                      </p>
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
