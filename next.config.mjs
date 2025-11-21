/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {

    remotePatterns: [
     
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
  
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      
      {
        protocol: "https",
        hostname: "clerk.com",
        pathname: "/**",
      },
    ],
  },
  
};

export default nextConfig;
