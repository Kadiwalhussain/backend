import express from 'express';
import { getAlbums, getAlbum, createAlbum } from '../controllers/albumController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getAlbums)
    .post(protect, authorize('artist'), createAlbum);

router.route('/:id')
    .get(getAlbum);

export default router;
