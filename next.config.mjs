/**
 * When building for GitHub Pages (CI sets GITHUB_PAGES=true) the app is
 * statically exported and served from /<repo-name>/, so basePath is required.
 * @type {import('next').NextConfig}
 */
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "tokyo-train-map";

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  ...(isPages
    ? {
        output: "export",
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
