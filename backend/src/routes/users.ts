import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, name, role } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    res.status(409).json({ message: '이미 사용중인 이메일입니다' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: role ?? 'worker' },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  res.status(201).json(user);
});

router.patch('/:id', async (req, res: Response) => {
  const { name, role, isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...(name && { name }), ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  res.json(user);
});

export default router;
