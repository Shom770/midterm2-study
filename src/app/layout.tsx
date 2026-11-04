import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { Shell } from '@/components/Shell';
import './globals.css';

// Instrument Sans at two widths (its wdth axis): narrow for clocks, big
// numbers and headings, normal for everything else. JetBrains Mono for code.
const sans = Instrument_Sans({ subsets: ['latin'], axes: ['wdth'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Midterm 2', template: '%s · Midterm 2' },
  description: 'CIS 1200 Midterm 2 study dashboard: plan, flashcards, timed exams, topic map and problems.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='black'/><text x='16' y='22' font-size='15' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='600'>M2</text></svg>",
  },
};

export const viewport: Viewport = { themeColor: '#000000', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
