import { Router } from 'express';
import multer from 'multer';
import * as client from '../controllers/clientController.js';
import { asyncHandler as h } from '../middlewares/async.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(Object.assign(new Error('Faqat rasm yuklash mumkin'), { status: 400 }));
  },
});

const router = Router();

router.get('/me', h(client.me));
router.put('/me/language', h(client.setLanguage));
router.get('/categories', h(client.categories));
router.get('/catalog', h(client.catalog));
router.post('/search/text', h(client.textSearch));
router.post('/search/photo', upload.single('photo'), h(client.photoSearch));
router.post('/search/object', h(client.objectSearch));
router.get('/search/:id', h(client.getSearchResults));
router.post('/models/:id/similar', h(client.similar));
router.get('/history', h(client.history));
router.get('/favorites', h(client.favorites));
router.get('/favorites/ids', h(client.favoriteIds));
router.post('/favorites/toggle', h(client.toggleFavoriteModel));
router.post('/deliver', h(client.deliver));

export default router;
