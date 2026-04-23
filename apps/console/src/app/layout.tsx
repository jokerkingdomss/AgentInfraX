import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { Bot, LayoutDashboard, Play, ScrollText, Settings } from 'lucide-react';
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
        <aside
          className="fixed inset-y-0 left-0 z-40 flex w-[60px] flex-col items-center border-r border-[var(--border)] bg-[var(--card)] py-4"
          role="navigation"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            aria-label="AgentInfra home"
            className="focus-ring press-scale mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Bot className="h-[18px] w-[18px]" />
          </Link>

          <nav className="flex flex-1 flex-col items-center gap-0.5" aria-label="Primary">
            <SidebarIcon href="/" icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Agents" active />
            <SidebarIcon href="#" icon={<Play className="h-[18px] w-[18px]" />} label="Runs" />
            <SidebarIcon href="#" icon={<ScrollText className="h-[18px] w-[18px]" />} label="Logs" />
          </nav>

          <SidebarIcon href="#" icon={<Settings className="h-[18px] w-[18px]" />} label="Settings" />
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 pl-[60px]">
          <main id="main-content" className="mx-auto max-w-[960px] px-10 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function SidebarIcon({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`focus-ring press-scale relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 ${
        active
          ? 'text-[var(--foreground)] bg-[var(--accent)]'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-x-[1px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      {icon}
    </Link>
  );
}
