import { Router } from 'express';
import { adminLogin, adminLogout, getAdminMe } from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Public admin authentication endpoint
router.post('/login', adminLogin);

// Protected admin session endpoints
router.post('/logout', authenticateAdmin, adminLogout);
router.get('/me', authenticateAdmin, getAdminMe);

export default router;
