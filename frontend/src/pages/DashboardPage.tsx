import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { worksApi } from '../api/works';
import { useAuthStore } from '../store/authStore';
import { STATUS_LABEL, STATUS_DOT } from '../lib/utils';
import { StatusBadge } from '../components/ui/Badge';
import type { Work, WorkStatus } from '../types';
import {
  CalendarDays, ClipboardList, Building2, Plus,
  ChevronRight, MapPin, TrendingUp, Clock, AlertCircle,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_BG: Record<WorkStatus, string> = {
  scheduled:   'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed:   'bg-emerald-500',
  on_hold:     'bg-slate-400',
};

const STATUS_LIGHT: Record<WorkStatus, { card: string; num: string; label: string }> = {
  scheduled:   { card: 'bg-blue-50 border-blue-100',    num: 'text-blue-700',    label: 'text-blue-500' },
  in_progress: { card: 'bg-amber-50 border-amber-100',  num: 'text-amber-700',   label: 'text-amber-500' },
  completed:   { card: 'bg-emerald-50 border-emerald-100', num: 'text-emerald-700', label: 'text-emerald-500' },
  on_hold:     { card: 'bg-slate-100 border-slate-200', num: 'text-slate-600',   label: 'text-slate-400' },
};

const STATUS_ORDER: WorkStatus[] = ['in_progress', 'scheduled', 'completed', 'on_hold'];

function getDateLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return '오늘';
  if (isTomorrow(d)) return '내일';
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEEE', { locale: ko });
  return format(d, 'M월 d일', { locale: ko });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthStore();

  const { data: works = [] } = useQuery<Work[]>({
    queryKey: ['works'],
    queryFn: () => worksApi.list(),
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayWorks = works.filter((w) => w.workDate.split('T')[0] === todayStr);
  const upcomingWorks = works
    .filter((w) => w.workDate.split('T')[0] > todayStr && w.status !== 'completed' && w.status !== 'on_hold')
    .sort((a, b) => a.workDate.localeCompare(b.workDate))
    .slice(0, 5);

  const recentCompleted = works
    .filter((w) => w.status === 'completed')
    .sort((a, b) => b.workDate.localeCompare(a.workDate))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '수고하셨어요';

  return (
    <div className="space-y-5">
      {/* 환영 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-md shadow-blue-200">
        <p className="text-blue-200 text-sm font-medium mb-1">{greeting},</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">{user?.name ?? '사용자'} 님</h1>
        <p className="text-blue-200/80 text-sm mt-1">
          {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>

        {/* 오늘 작업 요약 */}
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3">
          <CalendarDays size={16} className="text-blue-200 shrink-0" />
          {todayWorks.length > 0 ? (
            <p className="text-white text-sm font-semibold">
              오늘 작업 <span className="text-blue-200">{todayWorks.length}건</span> 예정
            </p>
          ) : (
            <p className="text-blue-200 text-sm">오늘 예정된 작업이 없습니다</p>
          )}
          <ChevronRight size={14} className="text-blue-300 ml-auto" onClick={() => navigate('/works')} />
        </div>
      </div>

      {/* 상태별 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {STATUS_ORDER.map((status) => {
          const count = works.filter((w) => w.status === status).length;
          const cfg = STATUS_LIGHT[status];
          return (
            <button
              key={status}
              onClick={() => navigate('/works')}
              className={`rounded-2xl border p-4 text-left transition-all hover:shadow-md ${cfg.card}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-2 h-2 rounded-full ${STATUS_BG[status]}`} />
                <p className={`text-[11px] font-bold uppercase tracking-wide ${cfg.label}`}>
                  {STATUS_LABEL[status]}
                </p>
              </div>
              <p className={`text-3xl font-black ${cfg.num}`}>{count}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">건</p>
            </button>
          );
        })}
      </div>

      {/* 오늘 작업 */}
      {todayWorks.length > 0 && (
        <section>
          <SectionHeader title="오늘의 작업" count={todayWorks.length} icon={<Clock size={14} />} />
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {todayWorks.map((w) => (
              <WorkRow key={w.id} work={w} label="오늘" onClick={() => navigate(`/works/${w.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* 예정 작업 */}
      {upcomingWorks.length > 0 && (
        <section>
          <SectionHeader title="다가오는 작업" count={upcomingWorks.length} icon={<TrendingUp size={14} />} />
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {upcomingWorks.map((w) => (
              <WorkRow key={w.id} work={w} label={getDateLabel(w.workDate)} onClick={() => navigate(`/works/${w.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* 진행중 없고 오늘 작업도 없을 때 빈 상태 */}
      {todayWorks.length === 0 && upcomingWorks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <AlertCircle size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">예정된 작업이 없습니다</p>
          {isAdmin() && (
            <button
              onClick={() => navigate('/works/new')}
              className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200"
            >
              <Plus size={14} /> 작업 등록
            </button>
          )}
        </div>
      )}

      {/* 바로가기 */}
      <section>
        <SectionHeader title="바로가기" icon={<ChevronRight size={14} />} />
        <div className="grid grid-cols-2 gap-2.5">
          <ShortcutCard
            icon={<ClipboardList size={20} className="text-blue-600" />}
            label="작업 목록"
            desc="전체 작업 현황"
            bg="bg-blue-50"
            onClick={() => navigate('/works')}
          />
          <ShortcutCard
            icon={<CalendarDays size={20} className="text-purple-600" />}
            label="작업 일정"
            desc="달력으로 보기"
            bg="bg-purple-50"
            onClick={() => navigate('/calendar')}
          />
          <ShortcutCard
            icon={<Building2 size={20} className="text-emerald-600" />}
            label="업체 관리"
            desc="현장 · 탱크 정보"
            bg="bg-emerald-50"
            onClick={() => navigate('/companies')}
          />
          {isAdmin() && (
            <ShortcutCard
              icon={<Plus size={20} className="text-amber-600" />}
              label="작업 등록"
              desc="새 작업 추가"
              bg="bg-amber-50"
              onClick={() => navigate('/works/new')}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, count, icon }: { title: string; count?: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-1">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
      {count !== undefined && (
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  );
}

function WorkRow({ work, label, onClick }: { work: Work; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left group"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_BG[work.status as WorkStatus]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{work.site.company.name}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
          <MapPin size={10} className="shrink-0" />
          {work.site.name}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 hidden sm:block">{label}</span>
        <StatusBadge status={work.status as WorkStatus} size="sm" />
        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

function ShortcutCard({ icon, label, desc, bg, onClick }: {
  icon: React.ReactNode; label: string; desc: string; bg: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md hover:border-slate-300 transition-all text-left group"
    >
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 text-sm">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{desc}</p>
      </div>
    </button>
  );
}
