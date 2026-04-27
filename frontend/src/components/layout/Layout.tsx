import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  CalendarDays, ClipboardList, Building2, Settings,
  LogOut, Droplets, LayoutDashboard,
} from 'lucide-react';

const navItems = [
  { to: '/', label: '홈', icon: LayoutDashboard, exact: true },
  { to: '/calendar', label: '달력', icon: CalendarDays, exact: false },
  { to: '/works', label: '작업 목록', icon: ClipboardList, exact: false },
  { to: '/companies', label: '업체', icon: Building2, exact: false },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 로고 + 네비 */}
          <div className="flex items-center gap-1">
            <Link to="/" className="flex items-center gap-2.5 mr-5">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-300">
                <Droplets size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-900 tracking-tight hidden sm:block">탱크맵</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-0.5">
              {navItems.map(({ to, label, icon: Icon, exact }) => {
                const active = isActive(to, exact);
                return (
                  <Link key={to} to={to}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </Link>
                );
              })}
              {isAdmin() && (
                <Link to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    location.pathname === '/admin'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings size={15} strokeWidth={location.pathname === '/admin' ? 2.5 : 2} />
                  관리자
                </Link>
              )}
            </nav>
          </div>

          {/* 유저 + 로그아웃 */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-700">
                  {user?.name?.[0] ?? 'U'}
                </span>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                user?.role === 'admin'
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {user?.role === 'admin' ? '관리자' : '작업자'}
              </span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
              <LogOut size={13} />
              <span className="hidden sm:block">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {/* 모바일 하단 네비 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex z-20 safe-area-pb">
        {navItems.map(({ to, label, icon: Icon, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link key={to} to={to}
              className={`flex-1 flex flex-col items-center pt-2.5 pb-3 gap-1 transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-blue-50' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          );
        })}
        {isAdmin() && (
          <Link to="/admin"
            className={`flex-1 flex flex-col items-center pt-2.5 pb-3 gap-1 transition-colors ${
              location.pathname === '/admin' ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${location.pathname === '/admin' ? 'bg-blue-50' : ''}`}>
              <Settings size={20} strokeWidth={location.pathname === '/admin' ? 2.5 : 1.8} />
            </div>
            <span className="text-[10px] font-semibold tracking-wide">관리자</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
