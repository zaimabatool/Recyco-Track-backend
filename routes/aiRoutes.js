import express from 'express';
import multer from 'multer';
import { analyzeScrapImage } from '../controllers/aiController.js';

const router = express.Router();

// Multer setup for temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Analyzing route
router.post('/analyze', upload.single('image'), analyzeScrapImage);

export default router;
