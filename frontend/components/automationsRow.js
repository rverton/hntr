import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/solid'

import Tag from './tagBadge'

export default function AutomationRow({ automation, linkTo, handler }) {

  function Wrapper({ children }) {
    if (linkTo) return <Link href={linkTo}>{children}</Link>

    return <div onClick={handler}>{children}</div>
  }

  return (
    <li key={automation.id}>
      <Wrapper>
        <a className="cursor-pointer block hover:bg-gray-50">
          <div className="flex items-center px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1 flex items-center">
              <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-3 md:gap-4">
                <div>
                  <p className="text-sm font-medium text-orange-800 truncate">{automation.name}</p>
                  <p className="mt-2 flex flex-col text-sm text-gray-500">
                    <span className="truncate">{automation.command}</span>
                  </p>
                </div>
                <div className="hidden md:block border-r border-l pl-2">
                  <div>
                    <p className="text-sm text-gray-900">
                      From <span className="font-bold">{automation.source_container}</span>
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div className="flex space-x-1">
                        {automation.source_tags.map(t => <Tag key={t} name={t} />)}
                        {automation.source_tags.length == 0 && <div>All tags</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div>
                    <p className="text-sm text-gray-900">
                      To <span className="font-bold">{automation.destination_container}</span>
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div className="flex space-x-1">
                        {automation.destination_tags.map(t => <Tag key={t} name={t} />)}
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

          <p className="px-10 pt-2 pb-4 flex text-sm text-gray-500">
            <span className="truncate">{automation.description || "No description set."}</span>
          </p>
        </a>
      </Wrapper>
    </li>
  )
}

