import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PROLINTAS Sales CRM",
    short_name: "PROLINTAS",
    description: "Kelola sales pipeline dan tindak lanjut PROLINTAS.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#f5f7fa",
    theme_color: "#102b46",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/img/image-apps-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/img/image-apps-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
