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
    return config;
  },
};

export default nextConfig;