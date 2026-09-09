import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Joshua Chung — AI Systems, Finance & Energy",
  description: "Joshua Chung builds AI-enabled operational systems, financial tools, and energy-infrastructure software.",
  openGraph: {
    title: "Joshua Chung — AI Systems, Finance & Energy",
    description: "Explore Joshua Chung's work across AI systems, finance, and energy infrastructure.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
