import { Router } from 'express';
import {
  listGallery,
  createGalleryItem,
  deleteGalleryItem,
} from '../controllers/gallery.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', listGallery);
router.post('/', authenticate, authorize('ADMIN', 'COORDINATOR'), createGalleryItem);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteGalleryItem);

export default router;
