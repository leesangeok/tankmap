import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { RoleBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { User } from '../types';
import {
  UserPlus, Users, ShieldCheck, UserCheck, UserX,
  X, Mail, Lock, User as UserIcon, ChevronDown,
} from 'lucide-react';

interface UserWithActive extends User {
  isActive: boolean;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'worker' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: users = [] } = useQuery<UserWithActive[]>({
    queryKey: ['users'],
    queryFn: () => client.get('/users').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => client.post('/users', form).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setForm({ email: '', password: '', name: '', role: 'worker' });
      setShowForm(false);
      setFormErrors({});
    },
    onError: (err: any) => {
      setFormErrors({ general: err.response?.data?.message ?? '계정 생성에 실패했습니다' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      client.patch(`/users/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '이름을 입력해주세요';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = '올바른 이메일을 입력해주세요';
    if (form.password.length < 6) errs.password = '비밀번호는 6자 이상이어야 합니다';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = () => {
    if (validateForm()) createMutation.mutate();
  };

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">사용자 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">계정과 권한을 관리합니다</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="shrink-0">
          <UserPlus size={15} /> 계정 추가
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Users size={18} />} label="전체 사용자" value={users.length} color="blue" />
        <StatCard icon={<ShieldCheck size={18} />} label="관리자" value={adminCount} color="violet" />
        <StatCard icon={<UserCheck size={18} />} label="활성 계정" value={activeCount} color="emerald" />
      </div>

      {/* 신규 계정 폼 */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-sm">새 계정 추가</h2>
            </div>
            <button onClick={() => { setShowForm(false); setFormErrors({}); }}
              className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {formErrors.general && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                {formErrors.general}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField label="이름" icon={<UserIcon size={13} />} error={formErrors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="홍길동"
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="권한" icon={<ShieldCheck size={13} />}>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={fieldInputClass}
                >
                  <option value="worker">작업자</option>
                  <option value="admin">관리자</option>
                </select>
              </FormField>
              <FormField label="이메일" icon={<Mail size={13} />} error={formErrors.email} className="col-span-2">
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  placeholder="example@company.com"
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="비밀번호" icon={<Lock size={13} />} error={formErrors.password} className="col-span-2">
                <input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  type="password"
                  placeholder="6자 이상"
                  className={fieldInputClass}
                />
              </FormField>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setFormErrors({}); }}>
                취소
              </Button>
              <Button className="flex-1" loading={createMutation.isPending} onClick={handleCreate}>
                계정 생성
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 유저 목록 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-sm">사용자 목록</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{users.length}명</span>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">등록된 사용자가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors">
                {/* 아바타 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                  user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.name?.[0] ?? '?'}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                    <RoleBadge role={user.role} />
                    {!user.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 ring-1 ring-red-100 font-semibold">
                        비활성
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
                </div>

                {/* 토글 버튼 */}
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                  disabled={toggleActiveMutation.isPending}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all shrink-0 ${
                    user.isActive
                      ? 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {user.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                  {user.isActive ? '비활성화' : '활성화'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: 'blue' | 'violet' | 'emerald';
}) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    violet:  'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

function FormField({ label, icon, error, children, className = '' }: {
  label: string; icon?: React.ReactNode; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const fieldInputClass = 'w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300';
