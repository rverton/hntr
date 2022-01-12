import Link from 'next/link'
import { useRouter } from 'next/router'

import api from '../lib/api'

export default function MarketingLayout({ children }) {
  const router = useRouter()

  const createBox = () => {
    api.post('/box/create')
      .then(resp => {
        router.push(`/records/?id=${resp.data.id}&container=hostnames`)
      })
      .catch(err => {
        console.error(err);
        alert('Error. Please try again later')
      })
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full h-[36rem] bg-gradient-to-b from-orange-100 -z-10"></div>
      <header className="z-10">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
            <div className="flex w-full justify-between">
              <div className="hidden space-x-8 lg:block">
                <Link href="/" >
                  <a className="text-base font-bold text-orange-900">hntr</a>
                </Link>
              </div>

              <div className="hidden space-x-8 lg:block">
                <Link href="/docs" className="text-base font-medium text-gray-600 hover:text-gray-500" >
                  <a className="font-medium">Docs</a>
                </Link>
                <a href="#" className="font-medium" onClick={createBox}> Create a box</a>
              </div>

            </div>
          </div>
        </nav>
      </header>

      {children}

      <footer className="bg-white">
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            {[].map((item) => (
              <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </a>
            ))}
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">&copy; {new Date().getFullYear()} hntr.io, All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
