import { Router } from 'express';
import * as clientController from '../controllers/clientController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { createClientSchema } from '../validators/clientValidator.js';

const router = Router();

router.use(authenticateToken);

// Admin and PM can manage clients and see developer list
router.get('/', requireRoles('ADMIN', 'PROJECT_MANAGER'), clientController.getClients);
router.post(
  '/',
  requireRoles('ADMIN', 'PROJECT_MANAGER'),
  validateRequest({ body: createClientSchema }),
  clientController.createClient
);
router.get('/developers', requireRoles('ADMIN', 'PROJECT_MANAGER'), clientController.getDevelopers);

export default router;
