import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  taskQuerySchema,
} from '../validators/taskValidator.js';

const router = Router();

router.use(authenticateToken);

// All roles can query tasks (role scoping is enforced inside service)
router.get('/', validateRequest({ query: taskQuerySchema }), taskController.getTasks);
router.get('/:id', taskController.getTask);

// Only Admin and PM can create tasks
router.post(
  '/',
  requireRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest({ body: createTaskSchema }),
  taskController.createTask
);

// All roles (Admin, PM, Developer) can update status, scoped strictly by ownership
router.patch(
  '/:id/status',
  validateRequest({ body: updateStatusSchema }),
  taskController.updateStatus
);

// Only Admin and PM can update general task properties
router.put(
  '/:id',
  requireRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest({ body: updateTaskSchema }),
  taskController.updateTask
);

export default router;
