/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  typescript: {
    ignoreBuildErrors: false,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
};

export default nextConfig;
