/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveExtensions: [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".css"
      ],
    },
  },
};

module.exports = nextConfig;
