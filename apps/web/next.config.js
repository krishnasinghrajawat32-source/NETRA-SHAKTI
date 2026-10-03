/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@netra-shakti/shared-types'],
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
