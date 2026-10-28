import { Router } from 'express';
import { authenticate, ensurePasswordChanged, requirePermission } from '../../middleware/auth';
import {
  changePasswordService,
  loginService,
  logoutService,
  meService,
} from './auth.service';

export const authRouter = Router();

authRouter.post('/login', loginService);
authRouter.get('/me', authenticate, meService);
authRouter.post('/logout', authenticate, logoutService);
authRouter.post('/change-password', authenticate, changePasswordService);

authRouter.get('/ping', authenticate, ensurePasswordChanged, (_req, res) => {
  res.json({ message: 'pong' });
});
authRouter.get('/admin-ping', authenticate, requirePermission('users.manage'), (_req, res) => {
  res.json({ message: 'admin pong' });
});