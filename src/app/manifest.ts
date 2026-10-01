import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plan zajęć URz",
    short_name: "Plan URz",
    description: "Plan zajęć Uniwersytetu Rzeszowskiego",
    start_url: "/day",
    scope: "/",
    display: "standalone",
    background_color: "#4D88FC",
    theme_color: "#4D88FC",
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/pwa-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
