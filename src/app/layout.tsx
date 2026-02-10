import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./global.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Miami Cars Investments | Plataforma de Inversión Premium",
  description: "Gestionamos tu flota de lujo en Miami con transparencia total. Invierte de forma inteligente con reportes en tiempo real y gestión operativa experta.",
  openGraph: {
    title: "Miami Cars Investments | Inversión Inteligente en Miami",
    description: "Maximiza tu capital con nuestra gestión de flotas de lujo. Transparencia, seguridad jurídica y rendición mensual.",
    images: [
      {
        url: "/og-fleet.png",
        width: 1408,
        height: 736,
        alt: "Miami Cars Investments Premium Fleet with Miami Skyline",
      },
    ],
    locale: "es_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miami Cars Investments",
    description: "Gestión experta de inversiones de flota en Miami.",
    images: ["/og-fleet.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
