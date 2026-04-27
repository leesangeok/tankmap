import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { worksApi } from '../api/works';
import { STATUS_LABEL, STATUS_DOT } from '../lib/utils';
import { StatusBadge } from '../components/ui/Badge';
import type { Work, WorkStatus } from '../types';
import { Plus, Search, ClipboardList, MapPin, ChevronRight, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'scheduled', label: '예정' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'on_hold', label: '보류' },
];

function getDateGroup(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return '오늘';
  if (isTomorrow(d)) return '내일';
  if (isThisWeek(d, { weekStartsOn: 1 })) return '이번 주';
  if (isThisMonth(d)) return '이번 달';
  return format(d, 'yyyy년 M월', { locale: ko });
}

function groupByDate(works: Work[]): { group: string; items: Work[] }[] {
  const map = new Map<string, Work[]>();
  for (const w of works) {
    const g = getDateGroup(w.workDate);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(w);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}

const STATUS_DOT_COLOR: Record<WorkStatus, string> = {
  scheduled:   'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed:   'bg-emerald-500',
  on_hold:     'bg-slate-400',
};

export default function WorkListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: works = [], isLoading } = useQuery<Work[]>({
    queryKey: ['works', { q: search, status: statusFilter }],
    queryFn: () => worksApi.list({ q: search || undefined, status: statusFilter || undefined }),
  });

  const groups = groupByDate(works);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">작업 목록</h1>
          <p className="text-sm text-slate-400 mt-0.5">총 {works.length}건</p>
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

      {/* 검색 + 필터 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="회사명 또는 현장명으로 검색..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {opt.value && (
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[opt.value as WorkStatus]}`} />
              )}
              {opt.label}
              {opt.value && (
                <span className={`text-[10px] font-bold px-1 rounded ${
                  statusFilter === opt.value ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {works.filter((w) => w.status === opt.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && works.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <ClipboardList size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold mb-1">작업이 없습니다</p>
          <p className="text-slate-400 text-sm mb-5">
            {search || statusFilter ? '검색 조건을 변경해보세요' : '첫 번째 작업을 등록해보세요'}
          </p>
          {!search && !statusFilter && isAdmin() && (
            <Link to="/works/new"
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200">
              <Plus size={15} /> 작업 등록
            </Link>
          )}
        </div>
      )}

      {/* 날짜 그룹별 목록 */}
      {!isLoading && groups.map(({ group, items }) => (
        <div key={group}>
          {/* 그룹 헤더 */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{group}</span>
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] font-semibold text-slate-400">{items.length}건</span>
          </div>

          {/* 카드 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {items.map((work) => (
              <WorkRow key={work.id} work={work} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkRow({ work }: { work: Work }) {
  const dateStr = parseISO(work.workDate);
  const day = format(dateStr, 'd');
  const weekday = format(dateStr, 'EEE', { locale: ko });

  return (
    <Link
      to={`/works/${work.id}`}
      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 transition-colors group"
    >
      {/* 상태 점 */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLOR[work.status as WorkStatus]}`} />

      {/* 날짜 미니 */}
      <div className="shrink-0 text-center w-8">
        <p className="text-base font-black text-slate-800 leading-none">{day}</p>
        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{weekday}</p>
      </div>

      {/* 구분선 */}
      <div className="w-px h-8 bg-slate-100 shrink-0" />

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate leading-tight">{work.site.company.name}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
          <MapPin size={10} className="shrink-0" />
          {work.site.name}
        </p>
      </div>

      {/* 우측 */}
      <div className="shrink-0 flex items-center gap-2">
        <StatusBadge status={work.status as WorkStatus} size="sm" />
        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
