import Link from 'next/link'
import MarketingLayout from '../components/marketingLayout'

export default function Docs({ children }) {
  return (
    <MarketingLayout>

      <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 p-3 flex text-sm">

        <div className="w-44 border-r">
          <ul>
            <li className="pb-3 flex flex-col space-y-2">
              <Link href="/docs">
                <a href="#" className="font-medium">What is hntr?</a>
              </Link>
            </li>

            <li className="pb-3 flex flex-col space-y-2">
              <Link href="/docs/user-interface">
                <a className="font-medium">User Interface</a>
              </Link>
              <a href="#" className="ml-4">Importing data</a>
              <a href="#" className="ml-4">Managing records</a>
              <a href="#" className="ml-4">Automations</a>
              <a href="#" className="ml-4">Shortcuts</a>
            </li>

            <li className="pb-3 flex flex-col space-y-2">
              <Link href="/docs/quota">
                <a href="#" className="font-medium">Fair Use Quota</a>
              </Link>
            </li>

            <li className="pb-3 flex flex-col space-y-2">
              <Link href="/docs/opensource">
                <a href="#" className="font-medium">Open Source</a>
              </Link>
            </li>

            <li className="pb-3 flex flex-col space-y-2">
              <Link href="/docs/security-and-privacy">
                <a href="#" className="font-medium">Security &amp; Privacy</a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="w-full px-6 text-base prose">
          {children}
        </div>

      </div>

    </MarketingLayout>
  )
}
