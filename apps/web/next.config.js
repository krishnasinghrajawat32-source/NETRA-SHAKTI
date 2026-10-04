/** @type {import('next').NextConfig} */

const rawApiTarget =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4001/api/v1';

// Remove trailing "/" so /api/v1//users jaisi URL na bane
const apiTarget = rawApiTarget.replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,

  // Don't expose framework header unnecessarily
  poweredByHeader: false,

  transpilePackages: ['@netra-shakti/shared-types'],

  /**
   * Security headers for the frontend.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },

  /**
   * Proxy frontend /api/v1/* requests to the backend.
   *
   * Production:
   * NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-DOMAIN/api/v1
   *
   * Local:
   * http://localhost:4001/api/v1
   */
  async rewrites() {
    const destination = apiTarget.startsWith('http')
      ? `${apiTarget}/:path*`
      : 'http://localhost:4001/api/v1/:path*';

    return [
      {
        source: '/api/v1/:path*',
        destination
      }
    ];
  }
};

module.exports = nextConfig;