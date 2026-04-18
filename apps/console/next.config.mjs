/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@agentinfra/shared-types', '@agentinfra/sdk'],
};

export default nextConfig;
