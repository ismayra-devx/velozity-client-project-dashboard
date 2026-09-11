import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidator.js';

const router = Router();

router.use(authenticateToken);

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);

router.post(
  '/',
  requireRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest({ body: createProjectSchema }),
  projectController.createProject
);

router.put(
  '/:id',
  requireRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest({ body: updateProjectSchema }),
  projectController.updateProject
);

export default router;
