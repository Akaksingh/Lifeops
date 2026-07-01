import { useState } from 'react';
import {
  Home,
  CheckSquare,
  Calendar,
  Inbox,
  Bell,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from 'lemma-sdk/react';
import { lemmaClient } from '../lib/lemma';
import { useHashRoute, navigate } from '../lib/router';
import { LemonLogo, SidebarScene, AvatarArt } from './Art';

const NAV = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Tasks', href: '/?filter=all', icon: CheckSquare },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Sources', href: '/sources', icon: Inbox },
  { label: 'Reminders', href: '/settings#billing', icon: Bell },
  { label: 'Insights', href: '/insights', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function NavSidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
} = {}) {
  const { user } = useAuth(lemmaClient);
  const { path } = useHashRoute();

  const plan = 'Pro';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = user as any;
  const name: string = u?.name || u?.firstName || (u?.email ? u.email.split('@')[0] : 'You');
  const avatar: string | undefined = u?.avatarUrl || u?.picture;

  return (
    <aside
      className={`w-64 fixed left-0 top-0 h-screen z-50 overflow-y-auto flex flex-col bg-gradient-to-b from-[#fdf4ec] via-[#f8f1fa] to-[#f3edfb] border-r border-neutral-200/60 transform transition-transform duration-200 md:translate-x-0 ${
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
      }`}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <LemonMark />
          <div className="leading-tight">
            <div className="font-extrabold text-[19px] tracking-tight text-neutral-900">Life Ops</div>
            <div className="text-[11px] text-neutral-400 -mt-0.5">by Lemon AI</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const target = href.split(/[?#]/)[0] || '/';
          const active = target === '/' ? path === '/' : path === target;
          return (
            <a
              key={label}
              href={`#${href}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(href);
                onClose?.();
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[15px] font-medium transition ${
                active
                  ? 'bg-purple-200/60 text-purple-700'
                  : 'text-neutral-500 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-purple-600' : 'text-neutral-400'}`} />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Decorative scene — uses /sidebar-scene.png exactly if present, else a styled fallback. */}
      <SceneArt />

      {/* User card */}
      <div className="mt-auto p-3">
        <a
          href="#/settings"
          onClick={(e) => {
            e.preventDefault();
            navigate('/settings');
            onClose?.();
          }}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-neutral-200/70 shadow-sm hover:border-neutral-300"
        >
          <Avatar src={avatar} />
          <div className="flex-1 leading-tight">
            <div className="text-[15px] font-semibold text-neutral-900">{name}</div>
            <div className="text-[12px] text-purple-500 font-medium">{plan} Plan</div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
        </a>
      </div>
    </aside>
  );
}

// Brand lemon — your exact logo from /logo.png if present, else a lemon glyph.
function LemonMark() {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src="/logo.png"
        alt="Life Ops"
        className="w-9 h-9 object-contain shrink-0"
        onError={() => setOk(false)}
      />
    );
  }
  return <LemonLogo className="w-9 h-9 shrink-0" />;
}

function SceneArt() {
  const [ok, setOk] = useState(true);
  return (
    <div className="mx-4 my-6 rounded-2xl h-56 overflow-hidden relative bg-gradient-to-b from-[#f7e9da] via-[#f3e3e8] to-[#efe6f6]">
      {/* Custom illustration if provided in web/public/sidebar-scene.png */}
      {ok && (
        <img
          src="/sidebar-scene.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setOk(false)}
        />
      )}
      {/* Fallback: hand-drawn SVG scene in the same style */}
      {!ok && <SidebarScene className="absolute inset-0 w-full h-full" />}
    </div>
  );
}

function Avatar({ src }: { src?: string }) {
  const [ok, setOk] = useState(true);
  const url = src || '/avatar.png';
  if (ok) {
    return (
      <img
        src={url}
        alt=""
        className="w-10 h-10 rounded-full object-cover"
        onError={() => setOk(false)}
      />
    );
  }
  return <AvatarArt className="w-10 h-10" />;
}
