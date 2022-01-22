import { useRouter } from 'next/router'

import MarketingLayout from '../components/marketingLayout'

import api from '../lib/api'

export default function Index() {
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
    <MarketingLayout>

      <div className="max-w-6xl mx-auto sm:px-6 lg:px-8 p-3">
        <div className="mt-6 space-y-7 w-2/3 mx-auto">
          <h1 className="text-gray-700 text-5xl font-bold text-center">
            Collaborative workspaces for security tester.
          </h1>
          <h2 className="text-gray-600 text-xl text-center">
            Create a box and start importing target data via your favourite tools over curl. Add tags and run
            automations on lists of tagged entries.
          </h2>
          <div className="grid gap-8 items-start justify-center">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-orange-800 rounded-lg blur-md"></div>
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

      <img alt="hntr screenshot" src="/screenshot.png" className="hidden md:block md:w-8/12 border shadow mt-8 mx-auto" />

      <div id="howitworks" className="max-w-6xl mx-auto my-20 sm:px-6 lg:px-8 p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="">
            <h2 className=" text-xl">Import and Export</h2>
            <p className="pt-2">Use curl to import and export data directly in and out of your box</p>
          </div>
          <div className="">
            <h2 className=" text-xl">Tags</h2>
            <p className="pt-2">Tag complete imports or just specific items. Filter them, export them, use them in your custom workflows.</p>
          </div>
          <div className="">
            <h2 className=" text-xl">Collaboration</h2>
            <p className="pt-2">Share your box and work together on targets.</p>
          </div>
          <div className="">
            <h2 className=" text-xl">Automations</h2>
            <p className="pt-2">Specify commands which are executed for each record of a (filtered) container and feed results back into a (new) container.</p>
          </div>
          <div className="">
            <h2 className=" text-xl">No setup</h2>
            <p className="pt-2">No registration and no configuration needed to play with some data. </p>
          </div>

          <div className="">
            <h2 className=" text-xl">Shortcuts</h2>
            <p className="pt-2">Use your keyboard to move fast through your box and execute actions.</p>
          </div>
        </div>
      </div>

    </MarketingLayout>
  )
}
