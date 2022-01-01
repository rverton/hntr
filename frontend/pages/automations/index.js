import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { CheckCircleIcon, ChevronRightIcon, MailIcon } from '@heroicons/react/solid'

import Layout from '../../components/layout'
import Tag from '../../components/tagBadge'
import useAutomations from '../../hooks/useAutomations'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export default function Home() {
  const router = useRouter()
  const { id } = router.query

  const { automations, isLoading, isError } = useAutomations(id)

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>

        <h2 className="text-xl">Automations</h2>

        {isLoading && <div>Loading</div>}
        {isError && <div>An error occured loading automations</div>}

        <div className="mt-4">
          <div className="bg-white shadow border overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {automations && automations.map((automation) => (
                <Automation key={automation.id} automation={automation} />
              ))}
            </ul>
          </div>
        </div>

      </Layout>

    </>
  )
}

function Automation({ automation }) {
  return (
    <li className="" key={automation.id}>
      <Link href={`/automations/show?id=${automation.box_id}&aid=${automation.id}`}>
        <a className="block hover:bg-gray-50">
          <div className="flex items-center px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1 flex items-center">
              <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-3 md:gap-4">
                <div>
                  <p className="text-sm font-medium text-indigo-600 truncate">{automation.name}</p>
                  <p className="mt-2 flex flex-col text-sm text-gray-500">
                    <span className="truncate">{automation.command}</span>
                  </p>
                </div>
                <div className="hidden md:block">
                  <div>
                    <p className="text-sm text-gray-900">
                      Source <span className="font-bold">{automation.source_table}</span>
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div>
                        {automation.source_tags.map(t => <Tag key={t} name={t} color="blue" />)}
                        {automation.source_tags.length == 0 && <div>All tags</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div>
                    <p className="text-sm text-gray-900">
                      Destination <span className="font-bold">{automation.destination_table}</span>
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div>
                        {automation.destination_tags.map(t => <Tag key={t} name={t} color="blue" />)}
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
        </a>
      </Link>
    </li>
  )
}
