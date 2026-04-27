import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi, tanksApi } from '../api/works';
import { TANK_TYPES, TANK_LOCATIONS } from '../lib/utils';
import type { Company, Site, Tank } from '../types';
import TankPhotoModal from '../components/TankPhotoModal';
import { getMediaUrl } from '../api/client';
import {
  Plus, Search, Building2, MapPin, Droplets,
  ChevronDown, Trash2, X, Camera,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const inputClass = 'w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300';

export default function CompanyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [photoModalTank, setPhotoModalTank] = useState<Tank | null>(null);
  const { isAdmin } = useAuthStore();

  const [newCompany, setNewCompany] = useState({ name: '', phone: '', memo: '' });
  const [newSite, setNewSite] = useState({ companyId: '', name: '', address: '' });
  const [newTank, setNewTank] = useState({ siteId: '', name: '', location: '지하', capacity: '', tankType: '' });
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['companies', search],
    queryFn: () => companiesApi.list(search || undefined),
  });

  const createCompanyMutation = useMutation({
    mutationFn: () => companiesApi.create({ name: newCompany.name.trim(), phone: newCompany.phone || undefined, memo: newCompany.memo || undefined }),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewCompany({ name: '', phone: '', memo: '' });
      setShowNewCompanyForm(false);
      setExpandedCompanyId(company.id);
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const createSiteMutation = useMutation({
    mutationFn: () => companiesApi.createSite(newSite.companyId, newSite.name.trim(), newSite.address || undefined),
    onSuccess: (site) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewSite({ companyId: '', name: '', address: '' });
      setExpandedSiteId(site.id);
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.deleteSite(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const createTankMutation = useMutation({
    mutationFn: () => tanksApi.create(newTank.siteId, {
      name: newTank.name.trim(),
      location: newTank.location,
      capacity: parseFloat(newTank.capacity),
      tankType: newTank.tankType || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setNewTank({ siteId: '', name: '', location: '지하', capacity: '', tankType: '' });
    },
  });

  const deleteTankMutation = useMutation({
    mutationFn: (id: string) => tanksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  return (
    <div className="space-y-4">
      {/* 탱크 사진 모달 */}
      {photoModalTank && (
        <TankPhotoModal tank={photoModalTank} onClose={() => setPhotoModalTank(null)} />
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">업체 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">회사 · 현장 · 탱크 등록</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200 transition-all shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:block">업체 등록</span>
          </button>
        )}
      </div>

      {/* 업체 등록 폼 */}
      {isAdmin() && showNewCompanyForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-sm">새 업체 등록</h2>
            </div>
            <button onClick={() => setShowNewCompanyForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">업체명 *</label>
                <input value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="예: ○○빌딩관리" className={inputClass} autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">연락처</label>
                <input value={newCompany.phone} onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  placeholder="02-1234-5678" className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">메모</label>
              <input value={newCompany.memo} onChange={(e) => setNewCompany({ ...newCompany, memo: e.target.value })}
                placeholder="특이사항, 담당자 정보 등" className={inputClass} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNewCompanyForm(false)}
                className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                취소
              </button>
              <button onClick={() => createCompanyMutation.mutate()}
                disabled={!newCompany.name.trim() || createCompanyMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors">
                {createCompanyMutation.isPending ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업체명 검색..."
          className={`${inputClass} pl-9 shadow-sm`}
        />
      </div>

      {/* 업체 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Building2 size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">{search ? '검색 결과가 없습니다' : '등록된 업체가 없습니다'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => {
            const isCompanyExpanded = expandedCompanyId === company.id;
            return (
              <div key={company.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* 회사 헤더 */}
                <button
                  onClick={() => setExpandedCompanyId(isCompanyExpanded ? null : company.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{company.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        현장 {company.sites?.length ?? 0}곳
                        {company.phone && ` · ${company.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isAdmin() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`'${company.name}'을(를) 삭제할까요?`)) deleteCompanyMutation.mutate(company.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCompanyExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* 회사 상세 */}
                {isCompanyExpanded && (
                  <div className="border-t border-slate-100">
                    {company.memo && (
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs text-slate-500 italic">{company.memo}</p>
                      </div>
                    )}

                    {/* 현장 목록 */}
                    {company.sites?.map((site) => {
                      const isSiteExpanded = expandedSiteId === site.id;
                      return (
                        <div key={site.id} className="border-b border-slate-100 last:border-0">
                          <button
                            onClick={() => setExpandedSiteId(isSiteExpanded ? null : site.id)}
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                <MapPin size={13} className="text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{site.name}</p>
                                <p className="text-xs text-slate-400">
                                  {site.address && `${site.address} · `}
                                  탱크 {site.tanks?.length ?? 0}개
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isAdmin() && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`'${site.name}' 현장을 삭제할까요?`)) deleteSiteMutation.mutate(site.id);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isSiteExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* 탱크 목록 */}
                          {isSiteExpanded && (
                            <div className="px-5 pb-3 space-y-2">
                              {site.tanks && site.tanks.length > 0 ? (
                                site.tanks.map((tank) => (
                                  <div key={tank.id}
                                    className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                    {/* 탱크 기본 정보 */}
                                    <div className="flex items-center gap-3 px-3.5 py-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Droplets size={14} className="text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-semibold text-slate-800">{tank.location} {tank.name}</p>
                                          {tank.photos && tank.photos.length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md">
                                              <Camera size={9} />
                                              {tank.photos.length}장
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-400">
                                          {tank.capacity}톤{tank.tankType ? ` · ${tank.tankType}` : ''}
                                        </p>
                                        {tank.note && (
                                          <p className="text-xs text-amber-600 mt-0.5">{tank.note}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => setPhotoModalTank(tank)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                        >
                                          <Camera size={12} />
                                          사진
                                        </button>
                                        {isAdmin() && (
                                          <button
                                            onClick={() => { if (confirm('탱크를 삭제할까요?')) deleteTankMutation.mutate(tank.id); }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* 사진 썸네일 미리보기 (있을 때만) */}
                                    {tank.photos && tank.photos.length > 0 && (
                                      <div
                                        className="flex gap-1.5 px-3.5 pb-3 overflow-x-auto cursor-pointer"
                                        onClick={() => setPhotoModalTank(tank)}
                                      >
                                        {tank.photos.slice(0, 5).map((photo) => (
                                          <div key={photo.id}
                                            className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                            <img src={getMediaUrl(photo.url)} alt=""
                                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-200" />
                                          </div>
                                        ))}
                                        {tank.photos.length > 5 && (
                                          <div className="w-16 h-16 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center">
                                            <p className="text-xs font-bold text-slate-500">+{tank.photos.length - 5}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 text-center py-2">등록된 탱크가 없습니다</p>
                              )}

                              {/* 탱크 추가 폼 — admin 전용 */}
                              {isAdmin() && (newTank.siteId === site.id ? (
                                <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100 space-y-2.5">
                                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">탱크 추가</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <select value={newTank.location}
                                      onChange={(e) => setNewTank({ ...newTank, location: e.target.value })}
                                      className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700">
                                      {TANK_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <input value={newTank.name}
                                      onChange={(e) => setNewTank({ ...newTank, name: e.target.value })}
                                      placeholder="이름 (예: 1호기)"
                                      className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:border-blue-400" />
                                    <input type="number" step="0.1" value={newTank.capacity}
                                      onChange={(e) => setNewTank({ ...newTank, capacity: e.target.value })}
                                      placeholder="용량 (톤)"
                                      className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:border-blue-400" />
                                    <select value={newTank.tankType}
                                      onChange={(e) => setNewTank({ ...newTank, tankType: e.target.value })}
                                      className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700">
                                      <option value="">종류 선택</option>
                                      {TANK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => createTankMutation.mutate()}
                                      disabled={!newTank.name.trim() || !newTank.capacity || createTankMutation.isPending}
                                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors">
                                      추가
                                    </button>
                                    <button onClick={() => setNewTank({ siteId: '', name: '', location: '지하', capacity: '', tankType: '' })}
                                      className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setNewTank({ ...newTank, siteId: site.id })}
                                  className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl text-xs text-slate-400 hover:text-blue-500 transition-all flex items-center justify-center gap-1.5 font-medium"
                                >
                                  <Plus size={13} /> 탱크 추가
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 현장 추가 — admin 전용 */}
                    {isAdmin() && (newSite.companyId === company.id ? (
                      <div className="p-4 bg-blue-50 border-t border-blue-100 space-y-2.5">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">현장 추가</p>
                        <input value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                          placeholder="현장명" className={`${inputClass} text-sm`} autoFocus />
                        <div className="flex gap-2">
                          <input value={newSite.address} onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                            placeholder="주소 (선택)" className={`flex-1 ${inputClass} text-sm`} />
                          <button onClick={() => createSiteMutation.mutate()}
                            disabled={!newSite.name.trim() || createSiteMutation.isPending}
                            className="px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors">
                            추가
                          </button>
                          <button onClick={() => setNewSite({ companyId: '', name: '', address: '' })}
                            className="px-3 border border-slate-200 bg-white text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewSite({ ...newSite, companyId: company.id })}
                        className="w-full py-3.5 text-sm text-blue-600 font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 border-t border-slate-100"
                      >
                        <Plus size={14} /> 현장 추가
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
