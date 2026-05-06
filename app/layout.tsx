import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";

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
  metadataBase: new URL('https://shopscribe-ai.com'),
  title: {
    default: 'ShopScribe — Fiches produits en 10 secondes',
    template: '%s | ShopScribe',
  },
  description: "Générez des fiches produits optimisées SEO avec l'IA. Titres, descriptions, bullet points, meta descriptions en français et anglais.",
  keywords: ['fiche produit', 'SEO', 'e-commerce', 'IA', 'Shopify', 'Etsy', 'Amazon', 'ChatGPT', 'GPT-4'],
  authors: [{ name: 'ShopScribe' }],
  creator: 'ShopScribe',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://shopscribe-ai.com',
    siteName: 'ShopScribe',
    title: 'ShopScribe — Fiches produits en 10 secondes',
    description: "Générez des fiches produits optimisées SEO avec l'IA. Titres, descriptions, bullet points, meta descriptions en français et anglais.",
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'ShopScribe — Fiches produits IA en 10 secondes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopScribe — Fiches produits en 10 secondes',
    description: "Générez des fiches produits optimisées SEO avec l'IA.",
    images: ['/og-image.svg'],
    creator: '@shopscribe',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
