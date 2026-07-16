import type { Metadata, Viewport } from "next";
import { Orbitron, Rajdhani, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});

const notoJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: "NEO TOKYO TRANSIT — 東京交通網",
  description:
    "A cyberpunk 3D explorable map of Tokyo's rail and subway network. Search stations, plan routes across JR, Tokyo Metro and Toei lines, and fly through the city grid.",
  keywords: [
    "Tokyo",
    "train map",
    "subway",
    "Tokyo Metro",
    "JR",
    "route planner",
    "3D map",
  ],
};

export const viewport: Viewport = {
  themeColor: "#030409",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${rajdhani.variable} ${notoJp.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
