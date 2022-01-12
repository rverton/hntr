import Head from 'next/head'
import { useRouter } from 'next/router'
import { format, parseISO } from 'date-fns'

import { Fragment, useRef, useState, useMemo } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import Layout from '../../components/layout'
import Tag from '../../components/tagBadge'
import LimitSelect from '../../components/limitSelect'
import SelectedAction from '../../components/selectedAction'

import useRecords from '../../hooks/useRecords'
import api from '../../lib/api'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}


const numberFormat = n => new Intl.NumberFormat().format(n)
const numberFormatSummary = num => Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)

const LIMIT = 500

export default function Home() {
  const router = useRouter()
  const { id, container } = router.query

  const [showModal, setShowModal] = useState(false)
  const [showModalExport, setShowModalExport] = useState(false)
  const [filterInput, setFilterInput] = useState("")
  const [selected, setSelected] = useState({})
  const [filter, setFilter] = useState("")
  const [limit, setLimit] = useState(LIMIT)
  const [page, setPage] = useState(0)
  const { records, count, mutate, isLoading, isError } = useRecords(id, container, filter, limit, page)

  const tableMemo = useMemo(() => {
    return <RecordsTable
      data={records}
      isLoading={isLoading}
      selected={selected}
      setSelected={setSelected}
      page={page}
      setPage={setPage}
      count={count}
      limit={limit}
    />;
  }, [records, isLoading, selected])

  const handleSubmit = (e) => {
    if (e.key == 'Enter') {
      setFilter(filterInput)
    }
  }

  const tagSelected = () => {
    let tags = prompt(`Choose new tags for ${Object.keys(selected).length} selected entries, separated by ',': `)
    if (tags === null) return;

    api.put(`/box/${id}/${container}/`, {
      records: Object.keys(selected),
      tags: tags.split(',')
    })
      .then(() => {
        mutate()
      })
      .catch(err => {
        alert(`Could not update records: ${err.response?.data?.error}`)
      })
  }

  const removeSelected = () => {
    if (!confirm('Are you sure you want to delete the selected entries?')) return;

    api.put(`/box/${id}/${container}/_deleterecords`, {
      records: Object.keys(selected),
    })
      .then(() => {
        mutate()
      })
      .catch(err => {
        alert(`Could not delete records: ${err.response?.data?.error}`)
      })

    setSelected({})
  }

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <div className="relative">
          <div className="h-16 ml-44 flex fixed top-0 left-0 right-0 items-center border-b border-gray-200 px-4 bg-white">

            <div className="w-full flex justify-between items-center">
              <div className="flex w-1/2 items-center">
                <input
                  minLength={2}
                  autoFocus
                  type="text"
                  name="filter"
                  id="filter"
                  className="focus:ring-0 focus:border-0 block w-full text-sm text-gray-600 border-0"
                  placeholder="Filter: foo.com tag:is_scope"
                  autoComplete=""
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  onKeyDown={handleSubmit}
                />
              </div>
              <div className="flex items-center space-x-1">
                {records && <div className="pr-4 text-sm">
                  {numberFormat(count)} total
                </div>}

                <SelectedAction
                  records={records}
                  selected={selected}
                  setSelected={setSelected}
                  tagSelected={tagSelected}
                  removeSelected={removeSelected}
                />
                <LimitSelect limit={limit} setLimit={setLimit} />

                <button onClick={() => setShowModalExport(true)} type="submit" className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-2 py-2 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-0">
                  Export
                </button>

                <button onClick={() => setShowModal(true)} type="submit" className="inline-flex items-center justify-center px-4 py-2 tracking-widest text-xs border border-transparent shadow-sm rounded-md text-white bg-orange-800 hover:bg-orange-900 sm:w-auto">
                  Import
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="pt-16">
          {isError && <div className="text-red-500">Error loading {container}.</div>}
          {!isError && tableMemo}
        </div>

      </Layout>

      <RecordsImportModal showModal={showModal} setShowModal={setShowModal} id={id} container={container} />
      <RecordsExportModal showModal={showModalExport} setShowModal={setShowModalExport} id={id} container={container} />
    </>
  )
}

function RecordsTable({ data, count, selected, setSelected, limit, page, setPage }) {
  const toggleRowSelection = (event, data) => {
    if (!event.altKey) return;

    let copy = Object.assign({}, selected)

    if (data in selected) {
      delete copy[data]
    } else {
      copy[data] = 1
    }

    setSelected(copy)
  }

  return (
    <div className="flex flex-col text-gray-500">
      {data?.length > 0 && data.map(record => (
        <div
          key={record.data}
          className={classNames(
            "flex px-6 space-x-5 border-b border-gray-100 py-1 text-sm bg-gray-50",
            record.data in selected ? 'bg-orange-100' : ''
          )}
          onClick={(event) => toggleRowSelection(event, record.data)}
        >
          <div className="flex items-center text-gray-400 w-32 font-light font-mono text-xs">
            {format(parseISO(record.created_at), 'yy-MM-dd HH:mm:ss')}
          </div>

          <div className="text-gray-600 w-1/2 truncate">
            {record.data}
          </div>

          <div className="flex space-x-1 text-sm">
            {record.tags?.map((tag, i) =>
              <Tag key={i} name={tag} />
            )}
            &nbsp;
          </div>
        </div>
      ))}

      {
        !data &&
        <div className="text-center text-lg text-bold p-3">Loading</div>
      }

      {
        data && !data.length &&
        <div className="text-center text-bold p-10">No records matching criteria. If you have not yet added data, please use the import function.</div>
      }

      {data && data.length > 0 && count > limit &&
        <nav
          className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page * limit) || 1}</span> to <span className="font-medium">{(page + 1) * limit}</span> of{' '}
              <span className="font-medium">{numberFormat(count)}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => {
                let newPage = page - 1;
                if (newPage < 0) newPage = 0;
                setPage(newPage)
              }}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </nav>
      }

    </div>

  )
}

function RecordsImportModal({ showModal, setShowModal, id, container }) {
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                    Import {container}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You can use the following command to pipe {container} directly into your box:
                    </p>

                    <div className="font-mono border p-5 text-sm my-3">
                      <span className="text-gray-400">cat {container}.txt | </span><span id="curl">curl --data-binary @- &quot;{apiUrl}/box/{id}/{container}&quot;</span>
                    </div>

                    <p className="text-sm text-gray-500">
                      If you want to add tags, just append it as a parameter:
                    </p>

                    <div className="font-mono border p-5 text-sm my-3">
                      <span className="text-gray-400">echo example.com | </span>curl --data-binary @- &quot;{apiUrl}/box/{id}/{container}<span className="font-bold">?tags=is_scope,is_wildcard</span>&quot;
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

function RecordsExportModal({ showModal, setShowModal, id, container }) {
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                    Export {container}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      You can use the following command to retrieve {container} directly into your shell:
                    </p>

                    <div className="font-mono border p-5 text-sm my-3">
                      <span id="curl">curl -s &quot;{apiUrl}/box/{id}/{container}&quot;</span>
                      <span className="text-gray-400"> | jq -r '.records[].data'</span>
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
