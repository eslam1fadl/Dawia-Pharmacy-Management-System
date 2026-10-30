import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import {
  archiveMedicineService,
  createMedicineService,
  getMedicineService,
  getPriceComparisonService,
  getPriceHistoryService,
  listCategoriesService,
  listMedicinesService,
  restoreMedicineService,
  updateMedicineService,
} from './medicines.service';

export const medicinesRouter = Router();

const canView = [authenticate, requirePermission('medicines.view')];
const canManage = [authenticate, requirePermission('medicines.manage')];

medicinesRouter.get('/categories', ...canView, listCategoriesService);
medicinesRouter.get('/', ...canView, listMedicinesService);
medicinesRouter.get('/:id', ...canView, getMedicineService);
medicinesRouter.get('/:id/price-history', ...canView, getPriceHistoryService);
medicinesRouter.get('/:id/price-comparison', ...canView, getPriceComparisonService);

medicinesRouter.post('/', ...canManage, createMedicineService);
medicinesRouter.patch('/:id', ...canManage, updateMedicineService);
medicinesRouter.patch('/:id/archive', ...canManage, archiveMedicineService);
medicinesRouter.patch('/:id/restore', ...canManage, restoreMedicineService);
