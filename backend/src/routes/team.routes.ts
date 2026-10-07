import { Router } from 'express';
import {
  listTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/team.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', listTeam);
router.post('/', authenticate, authorize('ADMIN'), createTeamMember);
router.put('/:id', authenticate, authorize('ADMIN'), updateTeamMember);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTeamMember);

export default router;
