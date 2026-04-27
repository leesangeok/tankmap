import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksApi } from '../api/works';
import { getMediaUrl } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { PHOTO_CATEGORY_LABEL, PHOTO_CATEGORY_ICON, formatDate } from '../lib/utils';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import type { PhotoCategory, WorkStatus } from '../types';
import {
  ArrowLeft, Pencil, Trash2, Calendar, Clock, Users, Gauge,
  MapPin, Camera, CheckSquare, ChevronRight, Upload, X, Droplets, AlertTriangle, FileText, StickyNote, Wrench,
} from 'lucide-react';

const PHOTO_CATEGORIES: PhotoCategory[] = ['before', 'during', 'after', 'oxygen'];

const STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: 'scheduled', label: '예정' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'on_hold', label: '보류' },
];

const STATUS_TOP_BAR: Record<WorkStatus, string> = {
  scheduled:   'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed:   'bg-emerald-500',
  on_hold:     'bg-slate-400',
};

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCategory, setUploadingCategory] = useState<PhotoCategory>('before');
  const [activePhotoTab, setActivePhotoTab] = useState<PhotoCategory>('before');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const { data: work, isLoading } = useQuery({
    queryKey: ['work', id],
    queryFn: () => worksApi.get(id!),
  });

  const checklistMutation = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      worksApi.toggleChecklist(id!, itemId, isChecked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work', id] }),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, category }: { file: File; category: string }) =>
      worksApi.uploadPhoto(id!, file, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => worksApi.deletePhoto(id!, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work', id] }),
  });

  const deleteWorkMutation = useMutation({
    mutationFn: () => worksApi.delete(id!),
    onSuccess: () => { navigate('/works'); queryClient.invalidateQueries({ queryKey: ['works'] }); },
  });

  const statusMutation = useMutation({
    mutationFn: (status: WorkStatus) => worksApi.updateStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work', id] }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate({ file, category: uploadingCategory });
    e.target.value = '';
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">불러오는 중...</p>
      </div>
    </div>
  );

  if (!work) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center">
        <Droplets size={36} className="text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">작업을 찾을 수 없습니다</p>
      </div>
    </div>
  );

  const photos = work.photos ?? [];
  const filteredPhotos = photos.filter((p: any) => p.category === activePhotoTab);
  const checklists = work.checklists ?? [];
  const checkedCount = checklists.filter((c: any) => c.isChecked).length;
  const tanks = work.tanks ?? [];
  const equipmentList: string[] = work.equipment ?? [];
  const progressPct = checklists.length > 0 ? (checkedCount / checklists.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 라이트박스 */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X size={24} />
          </button>
          <img src={lightboxSrc} alt="사진 확대" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div className="flex gap-2">
          {isAdmin() && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/works/${id}/edit`)}>
              <Pencil size={13} /> 수정
            </Button>
          )}
          {isAdmin() && (
            <Button
              variant="danger"
              size="sm"
              loading={deleteWorkMutation.isPending}
              onClick={() => { if (confirm('이 작업을 삭제할까요?')) deleteWorkMutation.mutate(); }}
            >
              <Trash2 size={13} /> 삭제
            </Button>
          )}
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className={`h-1.5 ${STATUS_TOP_BAR[work.status as WorkStatus]}`} />
        <div className="p-5">
          {/* 타이틀 + 배지 */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{work.site.company.name}</h1>
              <p className="text-slate-500 mt-0.5 font-medium">{work.site.name}</p>
              {work.site.address && (
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin size={12} />
                  {work.site.address}
                </p>
              )}
            </div>
            <StatusBadge status={work.status as WorkStatus} />
          </div>

          {/* 상태 변경 버튼 — admin 전용 */}
          {isAdmin() && (
            <div className="flex gap-1.5 mb-5 flex-wrap">
              <p className="w-full text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">상태 변경</p>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => statusMutation.mutate(value)}
                  disabled={work.status === value || statusMutation.isPending}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    work.status === value
                      ? 'bg-slate-100 text-slate-400 cursor-default ring-1 ring-slate-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 정보 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <InfoTile icon={<Calendar size={15} />} label="작업일" value={formatDate(work.workDate)} />
            {work.durationHours && <InfoTile icon={<Clock size={15} />} label="소요시간" value={`${work.durationHours}시간`} />}
            {work.requiredPeople && <InfoTile icon={<Users size={15} />} label="투입인원" value={`${work.requiredPeople}명`} />}
            {work.difficulty && (
              <InfoTile
                icon={<Gauge size={15} />}
                label="난이도"
                value={`${work.difficulty}/10`}
                accent={work.difficulty >= 8 ? 'red' : work.difficulty >= 5 ? 'amber' : 'emerald'}
              />
            )}
          </div>

          {/* 탱크 정보 */}
          {tanks.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2.5">작업 탱크</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tanks.map((tank: any) => (
                  <div key={tank.id}
                    className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Droplets size={14} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{tank.location} {tank.name}</p>
                      <p className="text-xs text-slate-400">{tank.capacity}톤{tank.tankType ? ` · ${tank.tankType}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 준비 장비 */}
          {equipmentList.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Wrench size={14} className="text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">준비 장비 / 도구</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {equipmentList.map((item) => (
                  <span key={item}
                    className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                    <Wrench size={10} className="text-slate-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 메모 섹션 */}
          {(work.notes || work.caution || work.memo) && (
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
              {work.notes && (
                <NoteBlock icon={<FileText size={13} />} label="특이사항" content={work.notes} />
              )}
              {work.caution && (
                <NoteBlock icon={<AlertTriangle size={13} />} label="주의사항" content={work.caution} color="amber" />
              )}
              {work.memo && (
                <NoteBlock icon={<StickyNote size={13} />} label="메모" content={work.memo} />
              )}
            </div>
          )}

          {/* 작성 정보 */}
          <p className="text-xs text-slate-300 mt-5 pt-4 border-t border-slate-100">
            작성: {work.createdBy.name} · {formatDate(work.createdAt)}
            {work.updatedBy && ` · 수정: ${work.updatedBy.name}`}
          </p>
        </div>
      </div>

      {/* 체크리스트 */}
      {checklists.length > 0 && (
        <Card>
          <CardHeader
            title="안전 체크리스트"
            icon={<CheckSquare size={17} />}
            action={
              <div className="flex items-center gap-2.5">
                <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPct === 100 ? 'bg-emerald-500' : progressPct > 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {checkedCount}<span className="text-slate-300 font-normal">/{checklists.length}</span>
                </span>
              </div>
            }
          />
          <div className="space-y-1.5">
            {checklists.map((c: any, i: number) => (
              <label key={c.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
                  c.isChecked
                    ? 'bg-emerald-50 border border-emerald-100/80'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  c.isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                }`}>
                  {c.isChecked && (
                    <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3">
                      <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    checked={c.isChecked}
                    onChange={(e) => checklistMutation.mutate({ itemId: c.checklistItemId, isChecked: e.target.checked })}
                    className="sr-only"
                  />
                </div>
                <span className={`text-sm font-medium flex-1 ${c.isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {c.checklistItem.label}
                </span>
                {c.isChecked && (
                  <span className="text-emerald-500 text-xs font-semibold">완료</span>
                )}
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* 사진 */}
      <Card>
        <CardHeader
          title="작업 사진"
          icon={<Camera size={17} />}
          action={<span className="text-xs text-slate-400 font-medium">{photos.length}장</span>}
        />

        {/* 카테고리 탭 */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
          {PHOTO_CATEGORIES.map((cat) => {
            const count = photos.filter((p: any) => p.category === cat).length;
            const isActive = activePhotoTab === cat;
            return (
              <button key={cat} onClick={() => setActivePhotoTab(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span>{PHOTO_CATEGORY_ICON[cat]}</span>
                {PHOTO_CATEGORY_LABEL[cat]}
                {count > 0 && (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-300 text-slate-600'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 사진 그리드 */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {filteredPhotos.map((photo: any) => (
              <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={getMediaUrl(photo.url)}
                  alt={PHOTO_CATEGORY_LABEL[photo.category]}
                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                  onClick={() => setLightboxSrc(getMediaUrl(photo.url))}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                <button
                  onClick={() => { if (confirm('사진을 삭제할까요?')) deleteMutation.mutate(photo.id); }}
                  className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => { setUploadingCategory(activePhotoTab); fileInputRef.current?.click(); }}
            className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl mb-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
          >
            <Camera size={28} className="text-slate-300 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-slate-400 group-hover:text-blue-500 font-medium transition-colors">
              {PHOTO_CATEGORY_LABEL[activePhotoTab]} 사진 추가
            </p>
            <p className="text-xs text-slate-300 mt-0.5">탭하여 업로드</p>
          </div>
        )}

        {/* 업로드 영역 */}
        <div className="flex gap-2 items-center">
          <select
            value={uploadingCategory}
            onChange={(e) => setUploadingCategory(e.target.value as PhotoCategory)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white text-slate-700 cursor-pointer"
          >
            {PHOTO_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{PHOTO_CATEGORY_ICON[cat]} {PHOTO_CATEGORY_LABEL[cat]}</option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl py-2.5 text-sm text-slate-500 hover:text-blue-600 disabled:opacity-50 transition-all font-semibold group"
          >
            <Upload size={15} className="group-hover:scale-110 transition-transform" />
            {uploadMutation.isPending ? '업로드 중...' : '사진 추가'}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </Card>
    </div>
  );
}

function InfoTile({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: string; accent?: 'red' | 'amber' | 'emerald';
}) {
  const accentColor = accent === 'red'
    ? 'text-red-600'
    : accent === 'amber'
    ? 'text-amber-600'
    : accent === 'emerald'
    ? 'text-emerald-600'
    : 'text-slate-900';
  return (
    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
      <div className="text-slate-400 mb-1.5">{icon}</div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`font-bold text-sm mt-0.5 ${accentColor}`}>{value}</p>
    </div>
  );
}

function NoteBlock({ icon, label, content, color }: {
  icon: React.ReactNode; label: string; content: string; color?: 'amber';
}) {
  const bg = color === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100';
  const iconColor = color === 'amber' ? 'text-amber-500' : 'text-slate-400';
  const labelColor = color === 'amber' ? 'text-amber-700' : 'text-slate-600';
  return (
    <div className={`p-4 rounded-xl border ${bg}`}>
      <div className={`flex items-center gap-1.5 mb-2 ${iconColor}`}>
        {icon}
        <p className={`text-xs font-bold uppercase tracking-wide ${labelColor}`}>{label}</p>
      </div>
      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}
