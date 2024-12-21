/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', 
  reactStrictMode: true,
  // Disable jsconfig paths plugin since you're using relative paths
  experimental: {
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Add this for Lighthouse
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config;
  },
};

module.exports = nextConfig;