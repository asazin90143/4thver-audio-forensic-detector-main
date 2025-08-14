/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed deprecated `appDir` — it's always enabled in Next.js 14
  experimental: {
    // other experimental flags can go here if needed
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  output: "standalone",
  images: {
    domains: [],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.(mp3|wav|ogg|m4a)$/,
      use: {
        loader: "file-loader",
        options: {
          publicPath: "/_next/static/audio/",
          outputPath: "static/audio/",
        },
      },
    });

    config.module.rules.push({
      test: /\.py$/,
      use: "raw-loader",
    });

    return config;
  },
};

module.exports = nextConfig;
