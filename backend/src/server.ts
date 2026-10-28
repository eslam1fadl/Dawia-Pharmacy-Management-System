import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { db } from './db/client';
import { runMigrations } from './db/migrate';
import { authRouter } from './modules/auth/auth.controller';
import { activityRouter } from './modules/activity/activity.controller';
import { medicinesRouter } from './modules/medicines/medicines.controller';
runMigrations();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'pharmacy.name'").get() as { value: string };
  const roles = db.prepare('SELECT name, label FROM roles').all();
  res.json({ ok: true, pharmacy: row.value, roles });
});

app.use('/api/auth', authRouter);
app.use('/api/activity', activityRouter);
app.use('/api/medicines', medicinesRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err.cause === 'number' ? err.cause : 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: status === 500 ? 'حدث خطأ غير متوقع' : err.message,
  });
});

app.listen(4000, () => {
  console.log('API running on http://localhost:4000');
});