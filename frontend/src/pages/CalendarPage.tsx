import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, getMonth, getYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { worksApi } from '../api/works';
import { STATUS_EVENT_COLOR, STATUS_LABEL, STATUS_DOT } from '../lib/utils';
import type { Work, WorkStatus } from '../types';
import { Plus, CalendarCheck, MapPin, ChevronRight, ChevronLeft, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { ko },
});

const STATUS_ORDER: WorkStatus[] = ['scheduled', 'in_progress', 'completed', 'on_hold'];

const STATUS_BAR_COLOR: Record<WorkStatus, string> = {
  scheduled:   'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed:   'bg-emerald-500',
  on_hold:     'bg-slate-400',
};

const STATUS_CARD_COLOR: Record<WorkStatus, { bg: string; text: string; num: string }> = {
  scheduled:   { bg: 'bg-blue-50',    text: 'text-blue-500',    num: 'text-blue-700' },
  in_progress: { bg: 'bg-amber-50',   text: 'text-amber-500',   num: 'text-amber-700' },
  completed:   { bg: 'bg-emerald-50', text: 'text-emerald-500', num: 'text-emerald-700' },
  on_hold:     { bg: 'bg-slate-100',  text: 'text-slate-400',   num: 'text-slate-600' },
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: works = [] } = useQuery<Work[]>({
    queryKey: ['works'],
    queryFn: () => worksApi.list(),
  });

  const events = works.map((work) => ({
    id: work.id,
    title: `${work.site.company.name} · ${work.site.name}`,
    start: new Date(work.workDate),
    end: new Date(work.workDate),
    resource: work,
  }));

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: STATUS_EVENT_COLOR[event.resource.status as WorkStatus],
      borderRadius: '5px',
      border: 'none',
      color: 'white',
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 6px',
    },
  });

  // 현재 보는 달 기준 필터링
  const viewYear = getYear(currentDate);
  const viewMonth = getMonth(currentDate);
  const monthWorks = works.filter((w) => {
    const d = new Date(w.workDate);
    return getYear(d) === viewYear && getMonth(d) === viewMonth;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayWorks = works.filter((w) => w.workDate.split('T')[0] === todayStr);

  const monthLabel = format(currentDate, 'yyyy년 M월', { locale: ko });
  const isCurrentMonth =
    viewYear === getYear(new Date()) && viewMonth === getMonth(new Date());

  const stats = STATUS_ORDER.map((s) => ({
    status: s,
    monthCount: monthWorks.filter((w) => w.status === s).length,
    totalCount: works.filter((w) => w.status === s).length,
  }));

  const totalMonthCount = monthWorks.length;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">작업 일정</h1>
          <p className="text-sm text-slate-400 mt-0.5">전체 {works.length}건 등록됨</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => navigate('/works/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200 transition-all shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:block">작업 등록</span>
          </button>
        )}
      </div>

      {/* 월별 통계 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              {isCurrentMonth ? '이번 달' : monthLabel}
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {totalMonthCount}건
            </span>
          </div>
          {/* 달 이동 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() - 1);
                setCurrentDate(d);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              오늘
            </button>
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setMonth(d.getMonth() + 1);
                setCurrentDate(d);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 상태별 카드 */}
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {stats.map(({ status, monthCount, totalCount }) => {
            const cfg = STATUS_CARD_COLOR[status];
            const pct = totalCount > 0 ? Math.round((monthCount / totalCount) * 100) : 0;
            return (
              <div key={status} className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_BAR_COLOR[status]}`} />
                  <p className="text-[11px] font-semibold text-slate-400 truncate">{STATUS_LABEL[status]}</p>
                </div>
                <p className={`text-2xl sm:text-3xl font-black ${cfg.num}`}>{monthCount}</p>
                <div className="mt-2">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR_COLOR[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">전체 {totalCount}건 중</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 오늘 작업 */}
      {todayWorks.length > 0 && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 sm:p-5 shadow-md shadow-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck size={15} className="text-blue-200" />
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">오늘의 작업</p>
            <span className="ml-auto text-xs font-bold text-blue-200">{todayWorks.length}건</span>
          </div>
          <div className="space-y-2">
            {todayWorks.map((w) => (
              <button
                key={w.id}
                onClick={() => navigate(`/works/${w.id}`)}
                className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[w.status as WorkStatus]}`} />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{w.site.company.name}</p>
                    <p className="text-blue-200 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {w.site.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-blue-200 hidden sm:block">
                    {STATUS_LABEL[w.status as WorkStatus]}
                  </span>
                  <ChevronRight size={14} className="text-blue-300 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 달력 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" style={{ height: 580 }}>
        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => navigate(`/works/${event.id}`)}
          messages={{
            next: '›',
            previous: '‹',
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
            agenda: '일정',
            noEventsInRange: '등록된 작업이 없습니다',
          }}
          culture="ko"
          style={{ padding: '12px' }}
        />
      </div>
    </div>
  );
}
