import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenbyten | Discover Markets & Vintage Shops",
  description: "Find the best farmers markets, vintage clothing stores, and consignment shops in Seattle. Your local guide to sustainable shopping.",
  openGraph: {
    title: "Tenbyten | Discover Markets & Vintage Shops",
    description: "Find the best farmers markets, vintage clothing stores, and consignment shops in Seattle.",
    type: "website",
    locale: "en_US",
    siteName: "Tenbyten",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Header />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
