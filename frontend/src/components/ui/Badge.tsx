import type { WorkStatus } from '../../types';

const STATUS_CONFIG: Record<WorkStatus, { label: string; className: string; dot: string }> = {
  scheduled:   { label: '예정',   className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',      dot: 'bg-blue-500' },
  in_progress: { label: '진행중', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',   dot: 'bg-amber-500' },
  completed:   { label: '완료',   className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80', dot: 'bg-emerald-500' },
  on_hold:     { label: '보류',   className: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80',  dot: 'bg-slate-400' },
};

interface StatusBadgeProps {
  status: WorkStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === 'admin';
  return (
    <span className={`inline-flex items-center rounded-full text-xs px-2.5 py-1 font-semibold ${
      isAdmin
        ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/80'
        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
    }`}>
      {isAdmin ? '관리자' : '작업자'}
    </span>
  );
}
