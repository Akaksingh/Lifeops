/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native addon — keep it external so the server bundler
  // doesn't try to pack the .node binary.
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Local-dev CORS bypass: hosted api.lemma.work does not allow CORS from
  // http://localhost:3000 (preflight 400, no Access-Control-Allow-Origin), so the
  // browser blocks every direct SDK fetch. We point NEXT_PUBLIC_LEMMA_API_URL at
  // this same-origin proxy; Next forwards (server-to-server, no CORS) and passes
  // the Bearer token through. The live WebSocket can't be proxied this way and
  // degrades gracefully (initial list still loads over HTTP; writes refetch).
  async rewrites() {
    return [
      { source: '/_lemma/:path*', destination: 'https://api.lemma.work/:path*' },
    ];
  },
};

export default nextConfig;
