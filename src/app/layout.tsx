import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Miami Cars Investments | Plataforma de Inversión Premium",
  description: "Gestionamos tu flota de lujo en Miami con transparencia total. Invierte de forma inteligente con reportes en tiempo real y gestión operativa experta.",
  openGraph: {
    title: "Miami Cars Investments | Inversión Inteligente en Miami",
    description: "Maximiza tu capital con nuestra gestión de flotas de lujo. Transparencia, seguridad jurídica y rendición mensual.",
    images: [
      {
        url: "/hero-mustang.jpg",
        width: 1200,
        height: 630,
        alt: "Miami Cars Investments Premium Fleet",
      },
    ],
    locale: "es_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miami Cars Investments",
    description: "Gestión experta de inversiones de flota en Miami.",
    images: ["/hero-mustang.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
