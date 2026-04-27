import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 시드 데이터 생성 시작...');

  // 체크리스트 아이템
  const checklistDefs = [
    { id: 'cl-01', label: '안전장비 착용 확인 (안전모, 안전화, 장갑)', order: 1 },
    { id: 'cl-02', label: '산소 농도 측정 (18% 이상 확인)', order: 2 },
    { id: 'cl-03', label: '유해가스 측정 완료', order: 3 },
    { id: 'cl-04', label: '탱크 외부 상태 육안 확인', order: 4 },
    { id: 'cl-05', label: '배수 밸브 잠금 확인', order: 5 },
    { id: 'cl-06', label: '진입 전 내부 환기 실시', order: 6 },
    { id: 'cl-07', label: '2인 1조 작업 확인', order: 7 },
    { id: 'cl-08', label: '비상 연락망 확인', order: 8 },
    { id: 'cl-09', label: '작업 후 내부 이물질 제거 확인', order: 9 },
    { id: 'cl-10', label: '소독약 투입 및 잔류량 확인', order: 10 },
  ];

  for (const item of checklistDefs) {
    await prisma.checklistItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  // 계정
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tankmap.com' },
    update: {},
    create: {
      email: 'admin@tankmap.com',
      passwordHash: await bcrypt.hash('admin1234', 10),
      name: '관리자',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'worker1@tankmap.com' },
    update: {},
    create: {
      email: 'worker1@tankmap.com',
      passwordHash: await bcrypt.hash('worker1234', 10),
      name: '김철수',
      role: 'worker',
    },
  });

  // 회사 + 현장 + 탱크
  const companyData = [
    {
      id: 'co-gangnam',
      name: '강남빌딩관리(주)',
      phone: '02-1234-5678',
      memo: '담당: 이부장 / 계약: 연 2회 청소',
      sites: [
        {
          id: 'si-gangnam-main',
          name: '강남타워 본관',
          address: '서울 강남구 테헤란로 152',
          tanks: [
            { id: 'tk-gm-01', name: '1호기', location: '지하', capacity: 50, tankType: '스테인리스', note: 'B2 기계실 입구 우측' },
            { id: 'tk-gm-02', name: '2호기', location: '지하', capacity: 50, tankType: '스테인리스', note: 'B2 기계실 입구 좌측' },
            { id: 'tk-gm-03', name: '옥상탱크', location: '지상', capacity: 20, tankType: 'FRP', note: '옥상 동쪽 끝' },
          ],
        },
        {
          id: 'si-gangnam-annex',
          name: '강남타워 별관',
          address: '서울 강남구 테헤란로 154',
          tanks: [
            { id: 'tk-ga-01', name: '지하1호', location: '지하', capacity: 30, tankType: '콘크리트', note: '노후 상태 주의 - 균열 진행 중' },
          ],
        },
      ],
    },
    {
      id: 'co-seocho',
      name: '서초아파트 관리소',
      phone: '02-9876-5432',
      memo: '담당: 박소장 / 입주민 민원 발생 잦음',
      sites: [
        {
          id: 'si-seocho-1',
          name: '서초 1단지',
          address: '서울 서초구 방배로 45',
          tanks: [
            { id: 'tk-s1-01', name: 'A동 지하', location: '지하', capacity: 80, tankType: '콘크리트', note: '청소 시 특수장비 필요' },
            { id: 'tk-s1-02', name: 'B동 지하', location: '지하', capacity: 80, tankType: '콘크리트' },
            { id: 'tk-s1-03', name: 'A동 옥상', location: '지상', capacity: 25, tankType: 'PE' },
            { id: 'tk-s1-04', name: 'B동 옥상', location: '지상', capacity: 25, tankType: 'PE' },
          ],
        },
        {
          id: 'si-seocho-2',
          name: '서초 2단지',
          address: '서울 서초구 방배로 67',
          tanks: [
            { id: 'tk-s2-01', name: '저수조 1', location: '지하', capacity: 100, tankType: '콘크리트' },
            { id: 'tk-s2-02', name: '저수조 2', location: '지하', capacity: 100, tankType: '콘크리트' },
          ],
        },
      ],
    },
    {
      id: 'co-mapo',
      name: '마포산업단지',
      phone: '02-3456-7890',
      memo: '공장 가동 중단 협의 후 작업 / 공업용수 주의',
      sites: [
        {
          id: 'si-mapo-1',
          name: '마포 제1공장',
          address: '서울 마포구 성산로 101',
          tanks: [
            { id: 'tk-mp-01', name: '공업용 1호', location: '지상', capacity: 200, tankType: '스테인리스', note: '식수 아님 - 공업용수 전용' },
            { id: 'tk-mp-02', name: '공업용 2호', location: '지상', capacity: 200, tankType: '스테인리스' },
          ],
        },
      ],
    },
    {
      id: 'co-hangang',
      name: '한강빌딩(주)',
      phone: '02-5555-1234',
      memo: '담당: 최팀장 / 프리미엄 오피스빌딩',
      sites: [
        {
          id: 'si-hangang-1',
          name: '한강뷰타워',
          address: '서울 영등포구 여의도동 13',
          tanks: [
            { id: 'tk-hg-01', name: '지하 메인', location: '지하', capacity: 120, tankType: '스테인리스' },
            { id: 'tk-hg-02', name: '지하 예비', location: '지하', capacity: 60, tankType: '스테인리스' },
            { id: 'tk-hg-03', name: '옥상 1호', location: '지상', capacity: 30, tankType: 'FRP' },
            { id: 'tk-hg-04', name: '옥상 2호', location: '지상', capacity: 30, tankType: 'FRP' },
          ],
        },
      ],
    },
  ];

  for (const co of companyData) {
    const { sites, ...companyFields } = co;
    await prisma.company.upsert({
      where: { id: companyFields.id },
      update: {},
      create: companyFields,
    });

    for (const si of sites) {
      const { tanks, ...siteFields } = si;
      await prisma.site.upsert({
        where: { id: siteFields.id },
        update: {},
        create: { ...siteFields, companyId: co.id },
      });

      for (const ta of tanks) {
        await prisma.tank.upsert({
          where: { id: ta.id },
          update: {},
          create: { ...ta, siteId: si.id },
        });
      }
    }
  }

  // 작업 데이터
  const allChecklistItems = await prisma.checklistItem.findMany({ orderBy: { order: 'asc' } });

  const workData = [
    {
      id: 'wk-01',
      siteId: 'si-gangnam-main',
      workDate: new Date('2026-04-10'),
      status: 'completed',
      durationHours: 6,
      requiredPeople: 3,
      difficulty: 4,
      notes: '1호기, 2호기 동시 진행. 슬러지 다량 발견하여 추가 세척 실시.',
      caution: '다음 작업 시 고압 세척기 추가 지참 필요',
      tankIds: ['tk-gm-01', 'tk-gm-02'],
      allChecked: true,
    },
    {
      id: 'wk-02',
      siteId: 'si-gangnam-main',
      workDate: new Date('2026-04-28'),
      status: 'scheduled',
      durationHours: 3,
      requiredPeople: 2,
      difficulty: 2,
      notes: '옥상 FRP 탱크 정기 점검',
      tankIds: ['tk-gm-03'],
      allChecked: false,
    },
    {
      id: 'wk-03',
      siteId: 'si-seocho-1',
      workDate: new Date('2026-04-15'),
      status: 'completed',
      durationHours: 10,
      requiredPeople: 4,
      difficulty: 7,
      notes: 'A동 콘크리트 탱크 균열 발견 - 실링 처리 완료. 내부 이끼 제거 후 소독.',
      caution: '6개월 후 재점검 필요. 균열 부위 지속 모니터링 요망.',
      memo: '실링 재료: 에폭시 방수제 3kg 사용',
      tankIds: ['tk-s1-01', 'tk-s1-02'],
      allChecked: true,
    },
    {
      id: 'wk-04',
      siteId: 'si-seocho-1',
      workDate: new Date('2026-05-05'),
      status: 'scheduled',
      durationHours: 4,
      requiredPeople: 2,
      difficulty: 2,
      notes: 'A, B동 옥상 PE 탱크 반기 점검',
      tankIds: ['tk-s1-03', 'tk-s1-04'],
      allChecked: false,
    },
    {
      id: 'wk-05',
      siteId: 'si-hangang-1',
      workDate: new Date('2026-04-22'),
      status: 'in_progress',
      durationHours: 8,
      requiredPeople: 3,
      difficulty: 5,
      notes: '지하 메인 탱크 내부 부식 확인 중. 예비 탱크도 동시 점검.',
      tankIds: ['tk-hg-01', 'tk-hg-02'],
      allChecked: false,
    },
    {
      id: 'wk-06',
      siteId: 'si-seocho-2',
      workDate: new Date('2026-04-24'),
      status: 'on_hold',
      durationHours: 12,
      requiredPeople: 5,
      difficulty: 8,
      notes: '저수조 용량이 커서 2일 작업 예정이었으나 입주민 민원으로 보류됨.',
      caution: '작업 재개 전 관리소 협의 필수. 단수 안내문 배포 선행.',
      memo: '5월 초 재조율 예정. 박소장 연락 필요.',
      tankIds: ['tk-s2-01', 'tk-s2-02'],
      allChecked: false,
    },
    {
      id: 'wk-07',
      siteId: 'si-mapo-1',
      workDate: new Date('2026-04-08'),
      status: 'completed',
      durationHours: 5,
      requiredPeople: 2,
      difficulty: 3,
      notes: '공업용수 탱크 - 식수 기준 아님. 공장 측 지시에 따라 처리.',
      tankIds: ['tk-mp-01'],
      allChecked: true,
    },
    {
      id: 'wk-08',
      siteId: 'si-gangnam-annex',
      workDate: new Date('2026-05-12'),
      status: 'scheduled',
      durationHours: 4,
      requiredPeople: 2,
      difficulty: 5,
      caution: '콘크리트 탱크 노후 상태 - 진입 전 안전 점검 철저히. 균열 확인 필수.',
      tankIds: ['tk-ga-01'],
      allChecked: false,
    },
    {
      id: 'wk-09',
      siteId: 'si-hangang-1',
      workDate: new Date('2026-03-20'),
      status: 'completed',
      durationHours: 4,
      requiredPeople: 2,
      difficulty: 2,
      notes: '옥상 FRP 탱크 2기 청소 완료. 이상 없음.',
      tankIds: ['tk-hg-03', 'tk-hg-04'],
      allChecked: true,
    },
  ];

  for (const { tankIds, allChecked, ...wf } of workData) {
    await prisma.work.upsert({
      where: { id: wf.id },
      update: {},
      create: {
        ...wf,
        createdById: admin.id,
        workTanks: {
          create: tankIds.map((tankId) => ({ tank: { connect: { id: tankId } } })),
        },
        checklists: {
          create: allChecklistItems.map((item) => ({
            checklistItemId: item.id,
            isChecked: allChecked ? Math.random() > 0.05 : Math.random() > 0.65,
          })),
        },
      },
    });
  }

  console.log('✅ 시드 완료!');
  console.log('   - 체크리스트 항목: 10개');
  console.log('   - 회사: 4개 / 현장: 7개 / 탱크: 17개');
  console.log('   - 작업: 9개 (완료4 / 진행중1 / 예정3 / 보류1)');
  console.log('\n계정:');
  console.log('   관리자: admin@tankmap.com / admin1234');
  console.log('   작업자: worker1@tankmap.com / worker1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
