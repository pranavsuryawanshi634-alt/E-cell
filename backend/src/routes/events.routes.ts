import { Router } from 'express';
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events.controller';
import { authenticate, optionalAuth, authorize } from '../middleware/auth';

const router = Router();

// Public / optional auth for checking registration
router.get('/', optionalAuth, listEvents);
router.get('/:idOrSlug', optionalAuth, getEvent);

// Admin / Coordinator operations
router.post('/', authenticate, authorize('ADMIN', 'COORDINATOR'), createEvent);
router.put('/:id', authenticate, authorize('ADMIN', 'COORDINATOR'), updateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEvent);

export default router;
