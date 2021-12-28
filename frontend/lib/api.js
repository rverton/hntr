import axios from 'axios'

export const client = axios.create({
  baseURL: "/api",
  timeout: 30000,
  retries: 3,
})

export default client
