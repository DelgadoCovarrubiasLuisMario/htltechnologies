/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true, // Para desarrollo, se puede optimizar después
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Excluir undici del procesamiento del servidor
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('undici');
    }
    
    return config;
  },
}

module.exports = nextConfig

