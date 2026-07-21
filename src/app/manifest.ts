import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AppHub - App Marketplace",
    short_name: "AppHub",
    description: "Discover, download, and publish web and Android applications on AppHub.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
