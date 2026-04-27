import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID as uuid } from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다'));
  },
});

router.post('/:id/photos', authenticate, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: '파일이 없습니다' });
    return;
  }

  const { category } = req.body;
  const validCategories = ['before', 'during', 'after', 'oxygen'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ message: '유효하지 않은 카테고리입니다' });
    return;
  }

  const url = `/uploads/${req.file.filename}`;

  const photo = await prisma.workPhoto.create({
    data: {
      workId: req.params.id,
      category,
      url,
      filename: req.file.filename,
      uploadedById: req.user!.id,
    },
  });

  res.status(201).json(photo);
});

router.delete('/:id/photos/:photoId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const photo = await prisma.workPhoto.findUnique({ where: { id: req.params.photoId } });

  if (!photo) {
    res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    return;
  }

  const filePath = path.join(uploadsDir, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.workPhoto.delete({ where: { id: req.params.photoId } });
  res.status(204).send();
});

export default router;
