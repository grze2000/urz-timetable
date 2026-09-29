/** @type {import('next').NextConfig} */
if (!process.env.NEXT_PUBLIC_API_URL?.trim()) {
  throw new Error("Brak wymaganej zmiennej NEXT_PUBLIC_API_URL.");
}

const nextConfig = {
  output: "standalone",
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
