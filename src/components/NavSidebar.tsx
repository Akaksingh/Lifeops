'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Inbox,
  Bell,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from 'lemma-sdk/react';
import { useLemma } from '@/lib/lemmaClient';

const NAV = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Tasks', href: '/?filter=all', icon: CheckSquare },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Sources', href: '/sources', icon: Inbox },
  { label: 'Reminders', href: '/settings#billing', icon: Bell },
  { label: 'Insights', href: '/insights', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function NavSidebar() {
  const client = useLemma();
  const { user } = useAuth(client);
  const pathname = usePathname();
  const [plan, setPlan] = useState<'Free' | 'Pro'>('Free');

  useEffect(() => {
    fetch('/api/plan')
      .then((r) => r.json())
      .then((d) => setPlan(d.pro ? 'Pro' : 'Free'))
      .catch(() => {});
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = user as any;
  const name: string = u?.name || u?.firstName || (u?.email ? u.email.split('@')[0] : 'You');
  const avatar: string | undefined = u?.avatarUrl || u?.picture;

  return (
    <aside className="w-64 fixed left-0 top-0 h-screen overflow-y-auto flex flex-col bg-gradient-to-b from-[#faf7f0] via-[#f6f2fb] to-[#efe9fb] border-r border-neutral-200/70">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍋</span>
          <div className="leading-tight">
            <div className="font-bold text-lg tracking-tight text-neutral-900">Life Ops</div>
            <div className="text-[11px] text-neutral-400 -mt-0.5">by Lemon AI</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href.split(/[?#]/)[0];
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-neutral-600 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-purple-600' : 'text-neutral-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Decorative scene */}
      <div className="mx-4 my-5 rounded-2xl bg-gradient-to-b from-orange-100/70 to-purple-100/70 h-40 flex items-end justify-center overflow-hidden relative">
        <div className="absolute top-3 right-4 text-lg">🪟</div>
        <div className="absolute left-4 bottom-3 text-xl">🪴</div>
        <div className="text-5xl mb-3">😌🍋</div>
      </div>

      {/* User card */}
      <div className="mt-auto p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-neutral-200/70 hover:border-neutral-300"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1 leading-tight">
            <div className="text-sm font-medium text-neutral-900">{name}</div>
            <div className="text-[11px] text-neutral-400">{plan} Plan</div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
        </Link>
      </div>
    </aside>
  );
}
