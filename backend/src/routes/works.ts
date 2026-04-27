import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

const workInclude = {
  site: { include: { company: true } },
  createdBy: { select: { name: true } },
  updatedBy: { select: { name: true } },
  workTanks: { include: { tank: true } },
  photos: { orderBy: { createdAt: 'asc' } as const },
  checklists: {
    include: { checklistItem: true },
    orderBy: { checklistItem: { order: 'asc' } } as const,
  },
};

router.get('/', async (req: AuthRequest, res: Response) => {
  const { date, status, company_id, q } = req.query;

  const works = await prisma.work.findMany({
    where: {
      ...(date && {
        workDate: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      }),
      ...(status && { status: status as string }),
      ...(company_id && { site: { companyId: company_id as string } }),
      ...(q && { site: { company: { name: { contains: q as string } } } }),
    },
    include: {
      site: { include: { company: true } },
      createdBy: { select: { name: true } },
      workTanks: { include: { tank: true } },
      _count: { select: { photos: true, checklists: true } },
    },
    orderBy: { workDate: 'desc' },
  });

  res.json(works.map(formatWork));
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { tankIds, equipment, workDate, status, ...rest } = req.body;

  const work = await prisma.work.create({
    data: {
      ...rest,
      workDate: new Date(workDate),
      status: status ?? 'scheduled',
      equipment: equipment ? JSON.stringify(equipment) : null,
      createdById: req.user!.id,
      ...(tankIds?.length && {
        workTanks: { create: tankIds.map((id: string) => ({ tankId: id })) },
      }),
    },
    include: workInclude,
  });

  const items = await prisma.checklistItem.findMany({ where: { isActive: true } });
  if (items.length > 0) {
    await prisma.workChecklist.createMany({
      data: items.map((item) => ({ workId: work.id, checklistItemId: item.id })),
    });
  }

  const full = await prisma.work.findUnique({ where: { id: work.id }, include: workInclude });
  res.status(201).json(formatWork(full!));
});

router.get('/:id', async (req, res: Response): Promise<void> => {
  const work = await prisma.work.findUnique({
    where: { id: req.params.id as string },
    include: workInclude,
  });
  if (!work) { res.status(404).json({ message: '작업을 찾을 수 없습니다' }); return; }
  res.json(formatWork(work));
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { tankIds, equipment, workDate, ...rest } = req.body;

  if (tankIds !== undefined) {
    await prisma.workTank.deleteMany({ where: { workId: req.params.id as string } });
    if (tankIds.length > 0) {
      await prisma.workTank.createMany({
        data: tankIds.map((id: string) => ({ workId: req.params.id as string, tankId: id })),
      });
    }
  }

  const work = await prisma.work.update({
    where: { id: req.params.id as string },
    data: {
      ...rest,
      ...(workDate && { workDate: new Date(workDate) }),
      ...(equipment !== undefined && { equipment: JSON.stringify(equipment) }),
      updatedById: req.user!.id,
    },
    include: workInclude,
  });
  res.json(formatWork(work));
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const work = await prisma.work.update({
    where: { id: req.params.id as string },
    data: { status: req.body.status, updatedById: req.user!.id },
  });
  res.json(work);
});

router.delete('/:id', requireAdmin, async (req, res: Response) => {
  await prisma.work.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
});

function formatWork(work: any) {
  return {
    ...work,
    equipment: work.equipment ? JSON.parse(work.equipment) : [],
    tanks: work.workTanks?.map((wt: any) => wt.tank) ?? [],
  };
}

export default router;
