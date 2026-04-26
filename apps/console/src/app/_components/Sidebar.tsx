'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, LayoutDashboard, Play, ScrollText, Settings } from 'lucide-react';

export function Sidebar() {
  return (
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
        <SidebarIcon href="/" icon={<LayoutDashboard className="h-[18px] w-[18px]" />} label="Agents" />
        <SidebarIcon href="/runs" icon={<Play className="h-[18px] w-[18px]" />} label="Runs" />
        <SidebarIcon href="#" icon={<ScrollText className="h-[18px] w-[18px]" />} label="Logs" />
      </nav>

      <SidebarIcon href="#" icon={<Settings className="h-[18px] w-[18px]" />} label="Settings" />
    </aside>
  );
}

function SidebarIcon({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active = href !== '#' && (pathname === href || pathname.startsWith(href === '/' ? '/agents' : href));
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
