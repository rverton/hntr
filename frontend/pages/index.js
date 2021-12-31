import Link from 'next/link'
import { useRouter } from 'next/router'

import api from '../lib/api'

export default function Index() {
  const router = useRouter()

  const createBox = () => {
    api.post('/box/create')
      .then(resp => {
        router.push('/hostnames/?id=' + resp.data.id)
      })
      .catch(err => {
        console.error(err);
        alert('Error. Please try again later')
      })
  }

  return (
    <>
      <header className="">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
            <div className="flex w-full justify-between">
              <div className="hidden space-x-8 lg:block">
                <Link href="/" className="text-base font-bold text-gray-700" >
                  [hntr]
                </Link>
                <Link passHref href="/box?id=123" className="text-base font-medium text-gray-600 hover:text-gray-500" >
                  How it works
                </Link>
                <Link href="/boxes" className="text-base font-medium text-gray-600 hover:text-gray-500" >
                  Blog
                </Link>
              </div>

              <div className="hidden space-x-8 lg:block">
                <Link href="#" className="text-base font-medium text-gray-600 hover:text-gray-500" >
                  About
                </Link>
              </div>

            </div>
          </div>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 p-3">
        <div className="mt-6 space-y-7 w-2/3 mx-auto">
          <h1 className="text-gray-700 text-5xl font-bold text-center">
            Collaborative workspaces for security tester.
          </h1>
          <h2 className="text-gray-600 text-xl text-center">
            Gather recon data (together) and connect your own automation worker.
          </h2>
          <div className="grid gap-8 items-start justify-center">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-red-500 rounded-lg blur-md"></div>
              <button
                onClick={createBox}
                className="relative mx-auto px-7 py-4 bg-black rounded-lg leading-none flex items-center">
                <span className="text-gray-200">
                  Create a box
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
