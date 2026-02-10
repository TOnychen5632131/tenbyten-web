import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import SupportWidget from "@/components/SupportWidget";

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
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-23YQSZBCQM" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-23YQSZBCQM');`}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Header />
            {children}
            <SupportWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
