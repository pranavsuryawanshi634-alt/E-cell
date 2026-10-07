import { Router } from 'express';
import {
  registerForEvent,
  getEventRegistrations,
  getMyRegistrations,
  updateRegistrationStatus,
  cancelMyRegistration,
  exportRegistrationsCsv,
} from '../controllers/registrations.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student routes
router.post('/', authenticate, registerForEvent);
router.post('/event/:id', authenticate, registerForEvent);
router.get('/my', authenticate, getMyRegistrations);
router.delete('/:id', authenticate, cancelMyRegistration);

// Staff routes (Admin, Coordinator, Member)
router.get(
  '/event/:eventId',
  authenticate,
  authorize('ADMIN', 'COORDINATOR', 'E_CELL_MEMBER'),
  getEventRegistrations
);
router.get(
  '/event/:eventId/export',
  authenticate,
  authorize('ADMIN', 'COORDINATOR'),
  exportRegistrationsCsv
);
router.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'COORDINATOR', 'E_CELL_MEMBER'),
  updateRegistrationStatus
);

export default router;
