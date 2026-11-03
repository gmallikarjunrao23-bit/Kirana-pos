import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'images.openfoodfacts.org',
      'static.openfoodfacts.org',
      'api.qrserver.com',
    ],
  },
}

export default nextConfig
