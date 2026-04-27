import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tanksApi } from '../api/works';
import { getMediaUrl } from '../api/client';
import type { Tank, TankPhoto, TankPhotoCategory } from '../types';
import { X, Upload, Camera, MapPin, Eye, Layers, Image, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const CATEGORY_CONFIG: Record<TankPhotoCategory, { label: string; icon: React.ReactNode; desc: string }> = {
  location: { label: '위치/외관', icon: <MapPin size={13} />, desc: '탱크가 있는 위치 및 외부 전경' },
  interior: { label: '내부',     icon: <Eye size={13} />,    desc: '탱크 내부 상태' },
  exterior: { label: '외부',     icon: <Layers size={13} />, desc: '탱크 외벽 및 주변 설비' },
  general:  { label: '일반',     icon: <Image size={13} />,  desc: '기타 참고 사진' },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as TankPhotoCategory[];

interface Props {
  tank: Tank;
  onClose: () => void;
}

export default function TankPhotoModal({ tank, onClose }: Props) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TankPhotoCategory>('location');
  const [uploadCategory, setUploadCategory] = useState<TankPhotoCategory>('location');
  const [caption, setCaption] = useState('');
  const [lightbox, setLightbox] = useState<{ photos: TankPhoto[]; index: number } | null>(null);

  const { data: photos = [], isLoading } = useQuery<TankPhoto[]>({
    queryKey: ['tank-photos', tank.id],
    queryFn: () => tanksApi.getPhotos(tank.id),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, category, caption }: { file: File; category: string; caption: string }) =>
      tanksApi.uploadPhoto(tank.id, file, category, caption || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tank-photos', tank.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setCaption('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => tanksApi.deletePhoto(tank.id, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tank-photos', tank.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setLightbox(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate({ file, category: uploadCategory, caption });
    e.target.value = '';
  };

  const tabPhotos = photos.filter((p) => p.category === activeTab);

  const openLightbox = (photo: TankPhoto, allInTab: TankPhoto[]) => {
    const idx = allInTab.findIndex((p) => p.id === photo.id);
    setLightbox({ photos: allInTab, index: idx });
  };

  const lb = lightbox;
  const lbPhoto = lb ? lb.photos[lb.index] : null;

  return (
    <>
      {/* 배경 */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

        <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Camera size={15} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{tank.location} {tank.name}</h2>
                  <p className="text-xs text-slate-400">
                    {tank.capacity}톤{tank.tankType ? ` · ${tank.tankType}` : ''} · 사진 {photos.length}장
                  </p>
                </div>
              </div>
              {tank.note && (
                <p className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg mt-2 border border-amber-100 inline-block">
                  {tank.note}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
              <X size={20} />
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-1.5 px-5 pt-4 pb-0">
            {CATEGORIES.map((cat) => {
              const count = photos.filter((p) => p.category === cat).length;
              const cfg = CATEGORY_CONFIG[cat];
              const isActive = activeTab === cat;
              return (
                <button key={cat} onClick={() => setActiveTab(cat)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-0.5">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  {count > 0 && (
                    <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isActive ? 'bg-white/25' : 'bg-slate-300 text-slate-600'
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 사진 그리드 */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tabPhotos.length === 0 ? (
              <div
                onClick={() => { setUploadCategory(activeTab); fileInputRef.current?.click(); }}
                className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <Camera size={28} className="text-slate-300 group-hover:text-blue-400 mb-2 transition-colors" />
                <p className="text-sm text-slate-400 group-hover:text-blue-500 font-medium transition-colors">
                  {CATEGORY_CONFIG[activeTab].label} 사진 추가
                </p>
                <p className="text-xs text-slate-300 mt-0.5">{CATEGORY_CONFIG[activeTab].desc}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {tabPhotos.map((photo) => (
                  <div key={photo.id}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer"
                    onClick={() => openLightbox(photo, tabPhotos)}
                  >
                    <img src={getMediaUrl(photo.url)} alt={photo.caption ?? CATEGORY_CONFIG[photo.category].label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-[10px] font-medium line-clamp-1">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 업로드 영역 */}
          <div className="p-5 border-t border-slate-100 space-y-2.5">
            <div className="flex gap-2">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as TankPhotoCategory)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                ))}
              </select>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="사진 설명 (선택)"
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all placeholder:text-slate-300"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl py-3 text-sm text-slate-500 hover:text-blue-600 disabled:opacity-50 transition-all font-semibold group"
            >
              <Upload size={15} className="group-hover:scale-110 transition-transform" />
              {uploadMutation.isPending ? '업로드 중...' : '사진 추가'}
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* 라이트박스 */}
      {lb && lbPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" onClick={() => setLightbox(null)}>
          {/* 라이트박스 헤더 */}
          <div className="flex items-center justify-between p-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-white text-sm font-semibold">
                {CATEGORY_CONFIG[lbPhoto.category].label}
              </p>
              {lbPhoto.caption && <p className="text-white/60 text-xs mt-0.5">{lbPhoto.caption}</p>}
              {lbPhoto.uploadedBy && (
                <p className="text-white/40 text-xs mt-0.5">업로드: {lbPhoto.uploadedBy.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (confirm('사진을 삭제할까요?')) deleteMutation.mutate(lbPhoto.id); }}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white/70 hover:text-white transition-all"
              >
                <Trash2 size={16} />
              </button>
              <button onClick={() => setLightbox(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 이미지 */}
          <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={(e) => e.stopPropagation()}>
            <img src={getMediaUrl(lbPhoto.url)} alt={lbPhoto.caption ?? ''}
              className="max-w-full max-h-full object-contain rounded-xl" />
          </div>

          {/* 이전/다음 + 페이지 표시 */}
          <div className="flex items-center justify-center gap-6 p-5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              disabled={lb.index === 0}
              onClick={() => setLightbox({ ...lb, index: lb.index - 1 })}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-white/60 text-sm font-medium">
              {lb.index + 1} / {lb.photos.length}
            </p>
            <button
              disabled={lb.index === lb.photos.length - 1}
              onClick={() => setLightbox({ ...lb, index: lb.index + 1 })}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
