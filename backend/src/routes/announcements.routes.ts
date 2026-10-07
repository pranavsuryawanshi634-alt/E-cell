import { Router } from 'express';
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public
router.get('/', listAnnouncements);

// Admin / Coordinator
router.post('/', authenticate, authorize('ADMIN', 'COORDINATOR'), createAnnouncement);
router.put('/:id', authenticate, authorize('ADMIN', 'COORDINATOR'), updateAnnouncement);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteAnnouncement);

export default router;
