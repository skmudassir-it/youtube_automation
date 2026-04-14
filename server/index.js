/**
 * AI Content Studio — Express API Server
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { runPipeline } from './pipeline.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// In-memory job store
const jobs = new Map();

/**
 * POST /api/jobs — Create a new generation job
 */
app.post('/api/jobs', upload.array('images', 5), (req, res) => {
  try {
    const { storyPrompt, visualStyle, platforms, musicUrl, videoLength } = req.body;

    if (!storyPrompt || !visualStyle || !platforms) {
      return res.status(400).json({ error: 'Missing required fields: storyPrompt, visualStyle, platforms' });
    }

    const parsedPlatforms = typeof platforms === 'string' ? JSON.parse(platforms) : platforms;

    // Build reference image URLs from uploaded files
    const referenceImageUrls = (req.files || []).map(
      file => `http://localhost:${PORT}/uploads/${file.filename}`
    );

    const jobId = uuidv4();
    const job = {
      id: jobId,
      storyPrompt,
      visualStyle,
      videoLength: parseInt(videoLength) || 15,
      platforms: parsedPlatforms,
      referenceImageUrls,
      musicUrl: musicUrl || null,
      status: 'queued',
      statusMessage: 'Job queued...',
      progress: 0,
      createdAt: new Date().toISOString(),
      // Outputs (filled during pipeline)
      scenes: null,
      imageUrls: null,
      videoUrls: null,
      voiceUrls: null,
      mergedVideoUrl: null,
      finalVideoUrl: null,
      metadata: null,
      publishResults: null,
      error: null,
    };

    jobs.set(jobId, job);

    // Run pipeline in background
    const updateStatus = (status, message, progress) => {
      job.status = status;
      job.statusMessage = message;
      job.progress = progress;
    };

    runPipeline(job, updateStatus).catch(err => {
      console.error(`Job ${jobId} failed:`, err);
    });

    res.status(201).json({ jobId, status: 'queued' });
  } catch (err) {
    console.error('Job creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/jobs/:id — Get job status and outputs
 */
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

/**
 * GET /api/jobs/:id/download — Redirect to download final video
 */
app.get('/api/jobs/:id/download', (req, res) => {
  const job = jobs.get(req.params.id);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (!job.finalVideoUrl) {
    return res.status(400).json({ error: 'Video not ready yet' });
  }

  res.redirect(job.finalVideoUrl);
});

/**
 * GET /api/health — Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeJobs: jobs.size,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI Content Studio API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
