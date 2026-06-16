/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/auth/v1/:path*',
        // Rewrite to Docker auth container port
        destination: 'http://auth:9999/:path*',
      },
      {
        source: '/rest/v1/:path*',
        // Rewrite to Docker postgrest container port
        destination: 'http://postgrest:3000/:path*',
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
