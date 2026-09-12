import { Router } from 'express';
import * as activityController from '../controllers/activityController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', activityController.getActivities);
router.get('/missed', activityController.getMissed);

export default router;
