import type { WorkStatus } from '../types';

export const STATUS_LABEL: Record<WorkStatus, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
  on_hold: '보류',
};

export const STATUS_COLOR: Record<WorkStatus, string> = {
  scheduled: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  on_hold: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

export const STATUS_DOT: Record<WorkStatus, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
  on_hold: 'bg-slate-400',
};

export const STATUS_EVENT_COLOR: Record<WorkStatus, string> = {
  scheduled: '#3b82f6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  on_hold: '#94a3b8',
};

export const PHOTO_CATEGORY_LABEL: Record<string, string> = {
  before: '작업 전',
  during: '작업 중',
  after: '작업 후',
  oxygen: '산소농도',
};

export const PHOTO_CATEGORY_ICON: Record<string, string> = {
  before: '📷',
  during: '🔧',
  after: '✅',
  oxygen: '🫁',
};

export const TANK_TYPES = ['콘크리트', '스테인리스', 'FRP', 'PE', '기타'];
export const TANK_LOCATIONS = ['지하', '지상'];

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric',
  });
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
