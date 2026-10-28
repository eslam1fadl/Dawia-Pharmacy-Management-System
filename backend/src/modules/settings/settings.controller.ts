import { Router } from 'express';
import { authenticate, ensurePasswordChanged, requirePermission } from '../../middleware/auth';
import {
  getSettingsService,
  updateSettingsService,
  listAllCategoriesService,
  createCategoryService,
  updateCategoryService,
  toggleCategoryService,
  getPaymentMethodsService,
  updatePaymentMethodsService,
} from './settings.service';

export const settingsRouter = Router();

const auth = [authenticate, ensurePasswordChanged];
const manage = [...auth, requirePermission('settings.manage')];

// General settings
settingsRouter.get('/', auth, getSettingsService);
settingsRouter.patch('/', manage, updateSettingsService);

// Categories
settingsRouter.get('/categories', manage, listAllCategoriesService);
settingsRouter.post('/categories', manage, createCategoryService);
settingsRouter.patch('/categories/:id', manage, updateCategoryService);
settingsRouter.patch('/categories/:id/toggle', manage, toggleCategoryService);

// Payment methods
settingsRouter.get('/payment-methods', manage, getPaymentMethodsService);
settingsRouter.patch('/payment-methods', manage, updatePaymentMethodsService);
