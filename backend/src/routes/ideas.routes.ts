import { Router } from 'express';
import {
  submitIdea,
  getMyIdeas,
  listIdeas,
  getIdeaById,
  reviewIdea,
  deleteIdea,
} from '../controllers/ideas.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student routes
router.post('/', authenticate, submitIdea);
router.get('/my', authenticate, getMyIdeas);
router.get('/:id', authenticate, getIdeaById);
router.delete('/:id', authenticate, deleteIdea);

// Staff routes
router.get('/', authenticate, authorize('ADMIN', 'COORDINATOR'), listIdeas);
router.put('/:id', authenticate, authorize('ADMIN', 'COORDINATOR'), reviewIdea);

export default router;
