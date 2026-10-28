import { Router } from 'express';
import { authenticate, ensurePasswordChanged, requirePermission } from '../../middleware/auth';
import {
  listPurchasesService,
  getPurchaseService,
  createPurchaseService,
  updatePurchaseService,
  confirmPurchaseService,
  reversePurchaseService,
} from './purchases.service';

export const purchasesRouter = Router();

const base = [authenticate, ensurePasswordChanged];
const canView = [...base, requirePermission('purchases.view')];
const canManage = [...base, requirePermission('purchases.manage')];

purchasesRouter.get('/', ...canView, listPurchasesService);
purchasesRouter.get('/:id', ...canView, getPurchaseService);

purchasesRouter.post('/', ...canManage, createPurchaseService);
purchasesRouter.patch('/:id', ...canManage, updatePurchaseService);
purchasesRouter.post('/:id/confirm', ...canManage, confirmPurchaseService);
purchasesRouter.post('/:id/reverse', ...canManage, reversePurchaseService);
