module.exports = {
  trailingSlash: true,
  reactStrictMode: true,
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return [];

    return [
      {
        source: '/api/:slug*',
        destination: `http://localhost:8080/api/:slug*`,
      },
    ]
  },
}

