import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { ToastContainer } from '@/components/ui/toast';
import { Sidebar } from './_components/Sidebar';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: 'AgentInfra',
  description: 'Self-hostable agent infrastructure — control console.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="min-h-screen flex">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* ── SIDEBAR ── */}
        <Sidebar />

        {/* ── MAIN ── */}
        <div className="flex-1 pl-[60px]">
          <main id="main-content" className="mx-auto max-w-[960px] px-10 py-10">
            {children}
          </main>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
