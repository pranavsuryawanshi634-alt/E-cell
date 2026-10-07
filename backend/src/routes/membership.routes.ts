import { Router } from 'express';
import {
  submitApplication,
  getMyApplication,
  listApplications,
  reviewApplication,
} from '../controllers/membership.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student
router.post('/', authenticate, submitApplication);
router.get('/my', authenticate, getMyApplication);

// Admin / Coordinator
router.get('/', authenticate, authorize('ADMIN', 'COORDINATOR'), listApplications);
router.put('/:id', authenticate, authorize('ADMIN', 'COORDINATOR'), reviewApplication);

export default router;
