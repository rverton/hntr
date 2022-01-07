import { useRouter } from 'next/router'
import Link from 'next/link'

import useBox from '../hooks/useBox'
import useRecordsCount from '../hooks/useRecordsCount'

import api from '../lib/api'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function capitalize(str) {
  const lower = str.toLowerCase();
  return str.charAt(0).toUpperCase() + lower.slice(1);
}

const numberFormat = num => Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)

export default function Layout({ children }) {
  const router = useRouter()
  const { id, container } = router.query
  const { box, isLoading, isError, mutate } = useBox(id)
  const { count, limit } = useRecordsCount(id)

  const handleUpdateBox = (shouldChangeName) => {
    let updateValues = { name: box.name, containers: box.containers }
    if (shouldChangeName) {
      updateValues.name = prompt('Please choose a new name for this box:')

      if (!updateValues.name) return;
    } else {
      let newName = prompt('Please choose a name to create a new container:')
      if (!newName) return;

      updateValues.containers = [...updateValues.containers, newName]
    }

    api.put(`/box/${id}`, updateValues)
      .then(() => {
        mutate()
      })
      .catch(err => {
        alert(`Could not update box: ${err.response?.data?.error}`)
      })
  }

  if (isLoading) return <div>Loading</div>
  if (isError) {
    if (isError.message === "404") return <div className="text-center p-10 text-xl">This box was not found</div>
    return <div>Error loading box data</div>
  }

  return (

    <div className="h-screen flex">

      <div className="h-screen flex flex-col fixed w-44 border-r border-gray-200">
        <div
          onClick={() => handleUpdateBox(true)}
          className="h-16 flex cursor-pointer p-4 border-b border-gray-200 font-medium text-sm items-center text-orange-800">{box.name}</div>
        <div className="grow">
          <div className="flex flex-col space-y-1 m-2">

            <div
              className={classNames(
                "flex items-center justify-between font-medium text-gray-600 px-2 py-1 text-sm rounded-sm",
              )}
            >
              <span>
                Container
              </span>
              <button onClick={() => handleUpdateBox(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            {box && box.containers.map((item) => (
              <Link href={`/records/?id=${id}&container=${item}`} key={item}>
                <a
                  className={classNames(
                    "font-medium text-gray-600 ml-4 px-2 py-1 text-sm hover:bg-gray-100 rounded-sm",
                    container == item ? 'bg-gray-100' : ''
                  )}
                >
                  {capitalize(item)}
                </a>
              </Link>
            ))}
            <Link href={`/automations/?id=${id}`}>
              <a
                className={classNames(
                  "font-medium text-gray-600 px-2 py-1 text-sm hover:bg-gray-100 rounded-sm",
                )}
              >
                Automations
              </a>
            </Link>
          </div>
        </div>

        <div className="flex flex-col p-4 text-sm font-medium">
          <a
            className={classNames(
              "font-medium text-gray-600 w-full px-2 py-1 text-sm hover:bg-gray-100 rounded-sm",
            )}
          >
            {numberFormat(count)} / {numberFormat(limit)} Quota
          </a>
          <a
            className={classNames(
              "font-medium text-gray-600 w-full px-2 py-1 text-sm hover:bg-gray-100 rounded-sm",
            )}
          >
            Help
          </a>
        </div>
      </div>

      <div className="pl-44 w-full">
        {children}
      </div>
    </div >

  )
}
