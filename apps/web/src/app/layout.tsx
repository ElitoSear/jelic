import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Jelic", description: "Estado del pestillo en vivo" };
export const viewport: Viewport = { themeColor: "#0b0d12" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
