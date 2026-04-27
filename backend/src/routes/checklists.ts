import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

// /api/checklist/items 용
export const checklistItemsRouter = Router();
checklistItemsRouter.use(authenticate);

checklistItemsRouter.get('/items', async (_req, res: Response) => {
  const items = await prisma.checklistItem.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  res.json(items);
});

// /api/works/:id/checklists 용
export const workChecklistRouter = Router();
workChecklistRouter.use(authenticate);

workChecklistRouter.get('/:id/checklists', async (req, res: Response) => {
  const checklists = await prisma.workChecklist.findMany({
    where: { workId: req.params.id },
    include: { checklistItem: true },
    orderBy: { checklistItem: { order: 'asc' } },
  });
  res.json(checklists);
});

workChecklistRouter.patch('/:id/checklists/:itemId', async (req: AuthRequest, res: Response) => {
  const { isChecked } = req.body;
  const checklist = await prisma.workChecklist.update({
    where: {
      workId_checklistItemId: {
        workId: req.params.id as string,
        checklistItemId: req.params.itemId as string,
      },
    },
    data: {
      isChecked,
      checkedById: isChecked ? req.user!.id : null,
      checkedAt: isChecked ? new Date() : null,
    },
    include: { checklistItem: true },
  });
  res.json(checklist);
});
