/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next from inferring the monorepo root from a parent lockfile
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;

