/** @type {import('next').NextConfig} */
const rawApiTarget = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/api/v1';
const apiTarget = rawApiTarget.replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@netra-shakti/shared-types'],
  async rewrites() {
    const destination = apiTarget.startsWith('http')
      ? `${apiTarget}/:path*`
      : 'http://localhost:4000/api/v1/:path*';

    return [
      {
        source: '/api/v1/:path*',
        destination
      }
    ];
  }
};

module.exports = nextConfig;
