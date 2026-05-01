import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-cal",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ShopScribe — Fiches produits en 10 secondes",
  description: "Générez des fiches produits optimisées SEO avec l'IA. Titres, descriptions, bullet points, meta descriptions en français et anglais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">{children}</body>
    </html>
  );
}
