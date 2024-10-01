/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/day",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
