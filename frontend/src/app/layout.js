import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: "NailEdge AI — Virtual Nail Try-On Platform",
  description: "Try on stunning nail designs in real-time with AI-powered virtual try-on. Preview French, glitter, abstract, and floral nail art before your salon visit. Free, no downloads required.",
  keywords: "nail art, virtual try-on, AI nail design, nail polish, manicure preview, augmented reality nails",
  openGraph: {
    title: "NailEdge AI — Virtual Nail Try-On",
    description: "Experience virtual nail designs powered by artificial intelligence. Try on stunning nail art in real-time.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
