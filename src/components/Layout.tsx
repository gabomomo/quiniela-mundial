import { Link, useLocation } from 'react-router-dom';
import { Trophy, LayoutGrid, BarChart2, User } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const location = useLocation();

  const nav = [
    { to: '/groups', icon: LayoutGrid, label: 'Partidos' },
    { to: '/leaderboard', icon: BarChart2, label: 'Tabla' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0A1628]/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <span className="font-black text-white text-lg">Quiniela</span>
          <span className="text-white/40 text-sm">Mundial 2026</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-[#0A1628]/95 backdrop-blur border-t border-white/10">
        <div className="flex">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${active ? 'text-blue-400' : 'text-white/40 hover:text-white/70'}`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
