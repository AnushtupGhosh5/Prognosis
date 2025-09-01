/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production deployment
  poweredByHeader: false,
  
  // Enable static optimization
  trailingSlash: false,
  
  // ESLint configuration for build
  eslint: {
    // Only run ESLint on these directories during build
    dirs: ['app', 'components', 'lib'],
    // Ignore ESLint errors during build for deployment
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration for build
  typescript: {
    // Ignore TypeScript errors during build for deployment
    ignoreBuildErrors: true,
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
