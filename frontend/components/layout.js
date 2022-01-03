import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import useBox from '../hooks/useBox'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const defaultNavigation = [
  { name: 'Hostnames', href: '/hostnames/', current: false },
  { name: 'URLs', href: '/urls/', current: false },
  { name: 'Automations', href: '/automations/', current: false },
]

export default function Layout({ children }) {
  const router = useRouter()
  const { id } = router.query
  const [navigation, setNavigation] = useState(defaultNavigation.slice());
  const { box, isLoading, isError } = useBox(id)

  // append current box id to every menu element
  useEffect(() => {
    const copy = defaultNavigation.map(a => { return { ...a } })
    setNavigation(copy.map(el => {
      el.href = `${el.href}?id=${id}`
      return el
    }))
  }, [id])

  if (isLoading) return <div>Loading</div>
  if (isError) {
    if (isError.message === "404") return <div className="text-center p-10 text-xl">This box was not found</div>
    return <div>Error loading box data</div>
  }

  return (

    <div className="h-screen flex">

      <div className="h-screen flex flex-col fixed w-44 border-r">
        <div className="h-16 flex p-4 border-b font-medium text-sm items-center text-orange-800">{box.name}</div>
        <div className="grow">
          <div className="flex flex-col space-y-2 m-2">
            {navigation.map((item) => (
              <Link href={item.href} key={item.name}>
                <a
                  className={classNames(
                    "font-medium text-gray-600 px-2 py-1 text-sm hover:bg-gray-100 rounded-sm",
                    item.current ? "bg-gray-100" : ""
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </a>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center p-4 text-sm font-medium">
          Help
        </div>
      </div>

      <div className="pl-44 w-full">
        {children}
      </div>
    </div >

  )
}
