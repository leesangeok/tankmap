import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksApi, companiesApi, tanksApi } from '../api/works';
import { TANK_TYPES, TANK_LOCATIONS } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import type { Company, Site, Tank } from '../types';
import {
  ArrowLeft, Building2, Droplets,
  ClipboardList, StickyNote, Plus, Check, Wrench, X,
} from 'lucide-react';

// 자주 쓰는 장비 프리셋
const EQUIPMENT_PRESETS = [
  '고압세척기', '진공청소기', '안전모', '방독면', '안전장갑',
  '안전화', '산소측정기', '가스측정기', '수중펌프', '에폭시',
  '소독약', '고압호스', '방수등', '사다리', '로프',
];

const schema = z.object({
  companyId: z.string().min(1, '회사를 선택해주세요'),
  siteId: z.string().min(1, '현장을 선택해주세요'),
  workDate: z.string().min(1, '작업일을 입력해주세요'),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'on_hold']),
  durationHours: z.coerce.number().optional(),
  requiredPeople: z.coerce.number().optional(),
  difficulty: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  caution: z.string().optional(),
  memo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass = 'w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-300';

const DIFFICULTY_LABELS = ['', '매우 쉬움', '쉬움', '보통', '보통', '보통', '약간 어려움', '어려움', '어려움', '매우 어려움', '극도로 어려움'];
const DIFFICULTY_COLOR = (v: number) => v >= 8 ? 'text-red-600' : v >= 5 ? 'text-amber-600' : 'text-emerald-600';

export default function WorkFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();
  const isEdit = Boolean(id);

  if (!isAdmin()) {
    navigate('/works', { replace: true });
    return null;
  }

  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedTankIds, setSelectedTankIds] = useState<string[]>([]);
  const [difficultyVal, setDifficultyVal] = useState(5);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newTank, setNewTank] = useState({ name: '', location: '지하', capacity: '', tankType: '' });
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [showNewSite, setShowNewSite] = useState(false);
  const [showNewTank, setShowNewTank] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: 'scheduled' },
  });

  const { data: existing } = useQuery({
    queryKey: ['work', id],
    queryFn: () => worksApi.get(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      const companyId = existing.site.company.id;
      setSelectedCompanyId(companyId);
      setSelectedSiteId(existing.siteId);
      setSelectedTankIds(existing.tanks?.map((t: Tank) => t.id) ?? []);
      setEquipment(existing.equipment ?? []);
      reset({
        companyId,
        siteId: existing.siteId,
        workDate: existing.workDate.split('T')[0],
        status: existing.status,
        durationHours: existing.durationHours ?? undefined,
        requiredPeople: existing.requiredPeople ?? undefined,
        difficulty: existing.difficulty ?? 5,
        notes: existing.notes ?? '',
        caution: existing.caution ?? '',
        memo: existing.memo ?? '',
      });
      setDifficultyVal(existing.difficulty ?? 5);
    }
  }, [existing, reset]);

  useEffect(() => { companiesApi.list().then(setCompanies); }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      companiesApi.sites(selectedCompanyId).then(setSites);
    } else {
      setSites([]); setTanks([]);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedSiteId) tanksApi.list(selectedSiteId).then(setTanks);
    else setTanks([]);
  }, [selectedSiteId]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const { companyId: _, ...rest } = data;
      const payload = { ...rest, tankIds: selectedTankIds, equipment };
      return isEdit ? worksApi.update(id!, payload) : worksApi.create(payload);
    },
    onSuccess: (work) => {
      queryClient.invalidateQueries({ queryKey: ['works'] });
      navigate(`/works/${work.id}`);
    },
  });

  const handleSelectCompany = (cId: string) => {
    setSelectedCompanyId(cId);
    setSelectedSiteId('');
    setSelectedTankIds([]);
    setValue('companyId', cId);
    setValue('siteId', '');
  };

  const handleSelectSite = (sId: string) => {
    setSelectedSiteId(sId);
    setSelectedTankIds([]);
    setValue('siteId', sId);
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    const company = await companiesApi.create({ name: newCompanyName.trim() });
    setCompanies((prev) => [...prev, company]);
    handleSelectCompany(company.id);
    setNewCompanyName(''); setShowNewCompany(false);
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim() || !selectedCompanyId) return;
    const site = await companiesApi.createSite(selectedCompanyId, newSiteName.trim(), newSiteAddress.trim() || undefined);
    setSites((prev) => [...prev, site]);
    handleSelectSite(site.id);
    setNewSiteName(''); setNewSiteAddress(''); setShowNewSite(false);
  };

  const handleAddTank = async () => {
    if (!newTank.name.trim() || !newTank.capacity || !selectedSiteId) return;
    const tank = await tanksApi.create(selectedSiteId, {
      name: newTank.name.trim(),
      location: newTank.location,
      capacity: parseFloat(newTank.capacity),
      tankType: newTank.tankType || undefined,
    });
    setTanks((prev) => [...prev, tank]);
    setSelectedTankIds((prev) => [...prev, tank.id]);
    setNewTank({ name: '', location: '지하', capacity: '', tankType: '' });
    setShowNewTank(false);
  };

  const toggleTank = (tankId: string) =>
    setSelectedTankIds((prev) =>
      prev.includes(tankId) ? prev.filter((id) => id !== tankId) : [...prev, tankId]
    );

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{isEdit ? '작업 수정' : '작업 등록'}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{isEdit ? '작업 정보를 수정합니다' : '새 작업을 등록합니다'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 회사 / 현장 */}
        <FormSection icon={<Building2 size={16} />} title="회사 / 현장">
          {/* 회사 */}
          <FormField label="회사" required error={errors.companyId?.message}>
            <div className="flex gap-2">
              <select
                value={selectedCompanyId}
                onChange={(e) => handleSelectCompany(e.target.value)}
                className={`flex-1 ${inputClass}`}
              >
                <option value="">회사 선택</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewCompany(!showNewCompany)}
                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 whitespace-nowrap flex items-center gap-1.5 font-medium transition-colors">
                <Plus size={14} /> 신규
              </button>
            </div>
            {showNewCompany && (
              <div className="flex gap-2 mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <input value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="회사명 입력"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompany())}
                  className={`flex-1 ${inputClass}`}
                  autoFocus
                />
                <button type="button" onClick={handleAddCompany}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">추가</button>
                <button type="button" onClick={() => setShowNewCompany(false)}
                  className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-500">취소</button>
              </div>
            )}
          </FormField>

          {/* 현장 */}
          <FormField label="현장" required error={errors.siteId?.message}>
            <div className="flex gap-2">
              <select
                value={selectedSiteId}
                onChange={(e) => handleSelectSite(e.target.value)}
                disabled={!selectedCompanyId}
                className={`flex-1 ${inputClass}`}
              >
                <option value="">현장 선택</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}{s.address ? ` (${s.address})` : ''}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewSite(!showNewSite)}
                disabled={!selectedCompanyId}
                className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 whitespace-nowrap flex items-center gap-1.5 font-medium disabled:opacity-40 transition-colors">
                <Plus size={14} /> 신규
              </button>
            </div>
            {showNewSite && (
              <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <input value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="현장명" className={inputClass} autoFocus />
                <div className="flex gap-2">
                  <input value={newSiteAddress} onChange={(e) => setNewSiteAddress(e.target.value)}
                    placeholder="주소 (선택)" className={`flex-1 ${inputClass}`} />
                  <button type="button" onClick={handleAddSite}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">추가</button>
                  <button type="button" onClick={() => setShowNewSite(false)}
                    className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-500">취소</button>
                </div>
              </div>
            )}
          </FormField>

          {/* 탱크 선택 */}
          <FormField label="작업 탱크">
            {!selectedSiteId ? (
              <div className="flex items-center gap-2 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <Droplets size={15} className="text-slate-300" />
                <p className="text-sm text-slate-400">현장을 먼저 선택해주세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tanks.map((tank) => (
                  <label key={tank.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTankIds.includes(tank.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      selectedTankIds.includes(tank.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                    }`}>
                      {selectedTankIds.includes(tank.id) && (
                        <Check size={11} className="text-white" strokeWidth={3} />
                      )}
                      <input type="checkbox" checked={selectedTankIds.includes(tank.id)}
                        onChange={() => toggleTank(tank.id)} className="sr-only" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{tank.location} {tank.name}</p>
                      <p className="text-xs text-slate-400">{tank.capacity}톤{tank.tankType ? ` · ${tank.tankType}` : ''}</p>
                    </div>
                    <Droplets size={14} className={selectedTankIds.includes(tank.id) ? 'text-blue-400' : 'text-slate-300'} />
                  </label>
                ))}
                {!showNewTank && (
                  <button type="button" onClick={() => setShowNewTank(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl text-sm text-slate-400 hover:text-blue-500 transition-all flex items-center justify-center gap-1.5 font-medium">
                    <Plus size={15} /> 탱크 추가
                  </button>
                )}
              </div>
            )}

            {showNewTank && (
              <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-sm font-semibold text-slate-700">새 탱크 추가</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">위치</label>
                    <select value={newTank.location}
                      onChange={(e) => setNewTank({ ...newTank, location: e.target.value })}
                      className={inputClass}>
                      {TANK_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">탱크명</label>
                    <input value={newTank.name}
                      onChange={(e) => setNewTank({ ...newTank, name: e.target.value })}
                      placeholder="예: 1호기"
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">용량 (톤)</label>
                    <input type="number" step="0.1" value={newTank.capacity}
                      onChange={(e) => setNewTank({ ...newTank, capacity: e.target.value })}
                      placeholder="예: 30"
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">종류</label>
                    <select value={newTank.tankType}
                      onChange={(e) => setNewTank({ ...newTank, tankType: e.target.value })}
                      className={inputClass}>
                      <option value="">선택</option>
                      {TANK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleAddTank}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold">추가</button>
                  <button type="button" onClick={() => setShowNewTank(false)}
                    className="flex-1 border border-slate-200 bg-white text-slate-600 py-2.5 rounded-xl text-sm font-medium">취소</button>
                </div>
              </div>
            )}
          </FormField>
        </FormSection>

        {/* 작업 정보 */}
        <FormSection icon={<ClipboardList size={16} />} title="작업 정보">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="작업일" required error={errors.workDate?.message}>
              <input type="date" {...register('workDate')} className={inputClass} />
            </FormField>

            <FormField label="상태">
              <select {...register('status')} className={inputClass}>
                <option value="scheduled">예정</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="on_hold">보류</option>
              </select>
            </FormField>

            <FormField label="소요 시간 (h)">
              <input type="number" step="0.5" placeholder="예: 4" {...register('durationHours')} className={inputClass} />
            </FormField>

            <FormField label="투입 인원 (명)">
              <input type="number" placeholder="예: 3" {...register('requiredPeople')} className={inputClass} />
            </FormField>
          </div>

          {/* 난이도 슬라이더 */}
          <FormField label="작업 난이도">
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">1 — 쉬움</span>
                <span className={`text-sm font-bold ${DIFFICULTY_COLOR(difficultyVal)}`}>
                  {difficultyVal}/10 {DIFFICULTY_LABELS[difficultyVal] ? `· ${DIFFICULTY_LABELS[difficultyVal]}` : ''}
                </span>
                <span className="text-xs text-slate-400">10 — 어려움</span>
              </div>
              <input
                type="range" min="1" max="10"
                {...register('difficulty', { onChange: (e) => setDifficultyVal(Number(e.target.value)) })}
                className="w-full h-2 appearance-none rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${
                    difficultyVal >= 8 ? '#ef4444' : difficultyVal >= 5 ? '#f59e0b' : '#10b981'
                  } 0%, ${
                    difficultyVal >= 8 ? '#ef4444' : difficultyVal >= 5 ? '#f59e0b' : '#10b981'
                  } ${(difficultyVal - 1) / 9 * 100}%, #e2e8f0 ${(difficultyVal - 1) / 9 * 100}%, #e2e8f0 100%)`
                }}
              />
            </div>
          </FormField>
        </FormSection>

        {/* 장비 / 도구 */}
        <FormSection icon={<Wrench size={16} />} title="준비 장비 / 도구">
          {/* 태그 입력 */}
          <div className="flex gap-2">
            <input
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = equipmentInput.trim();
                  if (v && !equipment.includes(v)) setEquipment((prev) => [...prev, v]);
                  setEquipmentInput('');
                }
              }}
              placeholder="장비명 입력 후 Enter"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                const v = equipmentInput.trim();
                if (v && !equipment.includes(v)) setEquipment((prev) => [...prev, v]);
                setEquipmentInput('');
              }}
              className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors shrink-0"
            >
              <Plus size={15} />
            </button>
          </div>

          {/* 프리셋 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">자주 쓰는 장비</p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_PRESETS.map((item) => {
                const selected = equipment.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setEquipment((prev) =>
                      selected ? prev.filter((e) => e !== item) : [...prev, item]
                    )}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {selected && <Check size={10} className="inline mr-1" strokeWidth={3} />}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택된 장비 태그 */}
          {equipment.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                선택된 장비 <span className="text-blue-600">{equipment.length}개</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {equipment.map((item) => (
                  <span key={item}
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {item}
                    <button type="button" onClick={() => setEquipment((prev) => prev.filter((e) => e !== item))}
                      className="text-blue-400 hover:text-blue-700 transition-colors">
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </FormSection>

        {/* 메모 */}
        <FormSection icon={<StickyNote size={16} />} title="메모 및 특이사항">
          {([
            { name: 'notes' as const, label: '특이사항', placeholder: '작업 시 특이했던 점을 기록하세요' },
            { name: 'caution' as const, label: '⚠ 주의사항', placeholder: '다음 작업 시 주의할 사항을 기록하세요' },
            { name: 'memo' as const, label: '기타 메모', placeholder: '그 외 메모사항' },
          ]).map(({ name, label, placeholder }) => (
            <FormField key={name} label={label}>
              <textarea {...register(name)} rows={3} placeholder={placeholder}
                className={`${inputClass} resize-none leading-relaxed`} />
            </FormField>
          ))}
        </FormSection>

        {/* 버튼 */}
        <div className="flex gap-3 pb-6">
          <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
            {isEdit ? '수정 완료' : '등록 완료'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <span className="text-blue-500">{icon}</span>
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, required, children, error }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-blue-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
