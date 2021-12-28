import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import { Disclosure } from '@headlessui/react'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline'

import useBox from '../hooks/useBox'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const defaultNavigation = [
  { name: 'Domains', href: '/domains/', current: false },
  { name: 'Services', href: '/services/', current: false },
  { name: 'URLs', href: '/urls/', current: false },
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
  if (isError) return <div>This box was not found</div>

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-900">
          {({ open }) => (
            <>
              <div className="max-w-7xl px-8 mx-auto">
                <div className="flex items-center justify-between h-12">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-white font-semibold">
                      {box.name}
                    </div>
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {navigation.map((item) => (
                          <Link href={item.href} key={item.name}>
                            <a
                              className={classNames(
                                item.current
                                  ? 'bg-gray-900 text-white'
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                'px-3 py-2 rounded-md text-sm font-medium'
                              )}
                              aria-current={item.current ? 'page' : undefined}
                            >
                              {item.name}
                            </a>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <button
                        type="button"
                        className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                      >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </button>

                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                        'block px-3 py-2 rounded-md text-base font-medium'
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <main className="mt-10">
          <div className="max-w-7xl px-8 mx-auto">
            <div className="bg-white px-8 py-6 rounded-md shadow-lg">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
