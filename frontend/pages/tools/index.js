import Head from 'next/head'
import { useRouter } from 'next/router'

import Layout from '../../components/layout'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

export default function Tools() {
  const router = useRouter()
  const { id } = router.query

  return (
    <>
      <Head>
        <title>hntr</title>
      </Head>

      <Layout>
        Automations
      </Layout>

    </>
  )
}
