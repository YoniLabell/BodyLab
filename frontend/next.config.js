/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'bodylab-frontend.onrender.com'],
    },
  },
}

module.exports = nextConfig
