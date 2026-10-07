import { Router } from 'express';
import {
  listBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blog.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public
router.get('/', listBlogs);
router.get('/:slug', getBlogBySlug);

// Admin / Coordinator
router.post('/', authenticate, authorize('ADMIN', 'COORDINATOR'), createBlog);
router.put('/:id', authenticate, authorize('ADMIN', 'COORDINATOR'), updateBlog);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteBlog);

export default router;
