import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { asyncHandler as h } from '../middlewares/async.middleware.js';

const router = Router();

router.get('/stats', h(admin.stats));
router.get('/categories', h(admin.categories));
router.get('/models', h(admin.listModels));
router.post('/models', h(admin.createModel));
router.put('/models/:id', h(admin.updateModel));
router.delete('/models/:id', h(admin.deleteModel));
router.get('/searches', h(admin.listSearches));

export default router;
