import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Noto_Naskh_Arabic } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Репетитор по арабскому',
  description: 'Изучайте арабский язык с ИИ-репетитором',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${notoNaskhArabic.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
