import { Router } from 'express';
import multer from 'multer';
import * as admin from '../controllers/adminController.js';
import { asyncHandler as h } from '../middlewares/async.middleware.js';

// Kichik rasmlar paketlab yuklanadi: bir so'rovda 500 tagacha, har biri ~30 KB
const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 500, fileSize: 2 * 1024 * 1024 },
});

const router = Router();

router.get('/stats', h(admin.stats));
router.get('/categories', h(admin.categories));
router.get('/models', h(admin.listModels));
router.post('/models', h(admin.createModel));
router.put('/models/:id', h(admin.updateModel));
router.delete('/models/:id', h(admin.deleteModel));
router.get('/searches', h(admin.listSearches));
router.get('/thumbnails', h(admin.listThumbnails));
router.post('/thumbnails', thumbnailUpload.array('files', 500), h(admin.uploadThumbnails));

export default router;
