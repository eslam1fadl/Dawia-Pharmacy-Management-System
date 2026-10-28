import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import {
  archiveSupplierService,
  createSupplierPaymentService,
  createSupplierService,
  getSupplierAccountService,
  getSupplierService,
  listSuppliersService,
  restoreSupplierService,
  updateSupplierService,
} from './suppliers.service';

export const suppliersRouter = Router();

const canView = [authenticate, requirePermission('suppliers.view')];
const canManage = [authenticate, requirePermission('suppliers.manage')];

suppliersRouter.get('/', ...canView, listSuppliersService);
suppliersRouter.get('/:id', ...canView, getSupplierService);
suppliersRouter.get('/:id/account', ...canView, getSupplierAccountService);

suppliersRouter.post('/', ...canManage, createSupplierService);
suppliersRouter.patch('/:id', ...canManage, updateSupplierService);
suppliersRouter.patch('/:id/archive', ...canManage, archiveSupplierService);
suppliersRouter.patch('/:id/restore', ...canManage, restoreSupplierService);
suppliersRouter.post('/:id/payments', ...canManage, createSupplierPaymentService);
