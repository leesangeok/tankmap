import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res: Response) => {
  const { q } = req.query;
  const companies = await prisma.company.findMany({
    where: q ? { name: { contains: q as string } } : undefined,
    include: {
      _count: { select: { sites: true } },
      sites: {
        include: {
          tanks: {
            include: { photos: { orderBy: { createdAt: 'asc' } } },
            orderBy: [{ location: 'asc' }, { name: 'asc' }],
          },
          _count: { select: { works: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  res.json(companies);
});

router.post('/', async (req, res: Response) => {
  const { name, phone, memo } = req.body;
  const company = await prisma.company.create({ data: { name, phone, memo } });
  res.status(201).json(company);
});

router.patch('/:id', async (req, res: Response) => {
  const company = await prisma.company.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(company);
});

router.delete('/:id', async (req, res: Response) => {
  await prisma.company.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.get('/:id/sites', async (req, res: Response) => {
  const sites = await prisma.site.findMany({
    where: { companyId: req.params.id },
    include: { tanks: { orderBy: [{ location: 'asc' }, { name: 'asc' }] } },
    orderBy: { name: 'asc' },
  });
  res.json(sites);
});

router.post('/sites', async (req, res: Response) => {
  const { companyId, name, address } = req.body;
  const site = await prisma.site.create({
    data: { companyId, name, address },
    include: { tanks: true },
  });
  res.status(201).json(site);
});

router.patch('/sites/:id', async (req, res: Response) => {
  const site = await prisma.site.update({
    where: { id: req.params.id },
    data: req.body,
    include: { tanks: true },
  });
  res.json(site);
});

router.delete('/sites/:id', async (req, res: Response) => {
  await prisma.site.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
