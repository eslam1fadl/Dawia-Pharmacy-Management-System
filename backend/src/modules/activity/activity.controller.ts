import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import { listActivityService } from '../activity/activity.service';

export const activityRouter = Router();

activityRouter.get('/', authenticate, requirePermission('activity.view'), listActivityService);