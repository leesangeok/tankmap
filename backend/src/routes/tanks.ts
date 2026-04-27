import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID as uuid } from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
router.use(authenticate);

const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다'));
  },
});

router.get('/sites/:siteId/tanks', async (req, res: Response) => {
  const tanks = await prisma.tank.findMany({
    where: { siteId: req.params.siteId },
    include: { photos: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ location: 'asc' }, { name: 'asc' }],
  });
  res.json(tanks);
});

router.post('/sites/:siteId/tanks', async (req, res: Response) => {
  const { name, location, capacity, tankType, note } = req.body;
  const tank = await prisma.tank.create({
    data: { siteId: req.params.siteId, name, location, capacity, tankType, note },
  });
  res.status(201).json(tank);
});

router.patch('/tanks/:id', async (req, res: Response) => {
  const tank = await prisma.tank.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(tank);
});

router.delete('/tanks/:id', async (req, res: Response) => {
  await prisma.tank.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// 탱크 사진 목록
router.get('/tanks/:id/photos', async (req, res: Response) => {
  const photos = await prisma.tankPhoto.findMany({
    where: { tankId: req.params.id },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(photos);
});

// 탱크 사진 업로드
router.post('/tanks/:id/photos', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: '파일이 없습니다' });
    return;
  }

  const { category = 'general', caption } = req.body;
  const validCategories = ['location', 'interior', 'exterior', 'general'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ message: '유효하지 않은 카테고리입니다' });
    return;
  }

  const photo = await prisma.tankPhoto.create({
    data: {
      tankId: req.params.id,
      category,
      caption: caption || null,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      uploadedById: req.user!.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  res.status(201).json(photo);
});

// 탱크 사진 삭제
router.delete('/tanks/:id/photos/:photoId', async (req: AuthRequest, res: Response): Promise<void> => {
  const photo = await prisma.tankPhoto.findUnique({ where: { id: req.params.photoId } });
  if (!photo) {
    res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    return;
  }

  const filePath = path.join(uploadsDir, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.tankPhoto.delete({ where: { id: req.params.photoId } });
  res.status(204).send();
});

export default router;
