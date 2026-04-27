import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import companiesRouter from './routes/companies';
import worksRouter from './routes/works';
import photosRouter from './routes/photos';
import { checklistItemsRouter, workChecklistRouter } from './routes/checklists';
import tanksRouter from './routes/tanks';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/works', worksRouter);
app.use('/api/works', photosRouter);
app.use('/api/works', workChecklistRouter);
app.use('/api/checklist', checklistItemsRouter);
app.use('/api', tanksRouter);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));

export default app;
