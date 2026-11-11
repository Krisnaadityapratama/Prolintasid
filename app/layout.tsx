import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PROLINTAS | Lead Management",
  description: "CRM pengelolaan leads PROLINTAS",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
