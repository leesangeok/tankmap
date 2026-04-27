import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Droplets, Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  email: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await authApi.login(data.email, data.password);
      login(res.token, res.user);
      navigate('/');
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* 배경 블롭 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-xl shadow-blue-300/40"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
          >
            <Droplets size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">탱크맵</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">물탱크 작업 관리 시스템</p>
        </div>

        {/* 카드 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-100/60 border border-white/60 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* 아이디 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                아이디
              </label>
              <input
                {...register('email')}
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="아이디를 입력하세요"
                className={`w-full rounded-2xl px-4 py-3.5 text-sm text-slate-900 transition-all outline-none
                  placeholder:text-slate-300 font-medium
                  ${errors.email
                    ? 'bg-red-50 border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-500/10'
                    : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10'
                  }`}
              />
              {errors.email && (
                <p className="text-red-400 text-xs font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                비밀번호
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  className={`w-full rounded-2xl px-4 py-3.5 pr-12 text-sm text-slate-900 transition-all outline-none
                    placeholder:text-slate-300 font-medium
                    ${errors.password
                      ? 'bg-red-50 border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-500/10'
                      : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* 에러 */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm text-center py-3 rounded-2xl font-semibold">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-bold py-3.5 rounded-2xl transition-all text-sm disabled:opacity-60 mt-1"
              style={{
                background: isSubmitting
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
              }}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
