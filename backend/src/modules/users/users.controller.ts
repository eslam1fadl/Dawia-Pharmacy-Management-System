import { Router } from 'express';
import { authenticate, ensurePasswordChanged, requirePermission } from '../../middleware/auth';
import {
  listUsers,
  listRoles,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  resetUserPassword,
} from './users.service';

export const usersRouter = Router();

// All users routes require authentication + password changed + users.manage permission
const guard = [authenticate, ensurePasswordChanged, requirePermission('users.manage')];

usersRouter.get('/',               ...guard, listUsers);
usersRouter.get('/roles',          ...guard, listRoles);
usersRouter.post('/',              ...guard, createUser);
usersRouter.patch('/:id',          ...guard, updateUser);
usersRouter.patch('/:id/activate', ...guard, activateUser);
usersRouter.patch('/:id/deactivate', ...guard, deactivateUser);
usersRouter.post('/:id/reset-password', ...guard, resetUserPassword);

