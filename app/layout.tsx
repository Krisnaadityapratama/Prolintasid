import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROLINTAS | Sales",
  description: "Sales CRM PROLINTAS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/img/Prolintas - Favicon.png",
    apple: "/img/image-apps.png",
  },
  appleWebApp: {
    capable: true,
    title: "PROLINTAS",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#102b46",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
