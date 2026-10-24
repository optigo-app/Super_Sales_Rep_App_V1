import path from "path";

const nextConfig = {
  basePath: "/V1",
  assetPrefix: "/V1",
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  sassOptions: {
    includePaths: [path.join(process.cwd(), "src")],
  },

  webpack: (config) => {
    config.cache = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      "@mc": path.join(process.cwd(), "src/app/magicCatalog"),
    };
    return config;
  },
};

export default nextConfig;