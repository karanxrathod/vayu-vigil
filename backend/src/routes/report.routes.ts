import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { query, execute } from '../db';
import { optionalAuth, authenticate, authorizeRoles, getEnforcedWardId } from '../middleware/auth';
import { classifyImage, transcribeAudioNote, translateToEnglish } from '../services/ai.service';
import { runScoringJob } from '../services/scoring.service';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image and audio files are allowed.'));
    }
  }
});

/**
 * Reverse Geocoder helper
 * Maps lat/lon to human-readable locality names for demo wards
 */
function reverseGeocodeLocality(lat: number, lon: number): { name: string; ward_id: string; city_id: string } {
  // Bhalswa / Sector 12 Area
  if (lat >= 28.72 && lat <= 28.78 && lon >= 77.13 && lon <= 77.18) {
    return { name: 'Sector 12, near Bhalswa Landfill Rd', ward_id: 'ward-1-sector-12', city_id: 'city-1-delhi' };
  }
  // Sector 9 Market Area
  if (lat >= 28.69 && lat < 28.72 && lon >= 77.17 && lon <= 77.21) {
    return { name: 'Sector 9 Market Junction', ward_id: 'ward-2-sector-9', city_id: 'city-1-delhi' };
  }
  // Ring Road Area
  if (lat >= 28.65 && lat < 28.69 && lon >= 77.21 && lon <= 77.25) {
    return { name: 'Ring Road Traffic Junction', ward_id: 'ward-3-ring-road', city_id: 'city-1-delhi' };
  }
  // Default fallback
  return { name: 'Sector 14 Civic Ward Area', ward_id: 'ward-1-sector-12', city_id: 'city-1-delhi' };
}

/**
 * POST /reports
 * Citizen pollution incident reporting endpoint with auto AI classification
 */
router.post(
  '/',
  optionalAuth,
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'voice_clip', maxCount: 1 }]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const photoFile = files?.['photo']?.[0];
      const voiceFile = files?.['voice_clip']?.[0];

      const { description = '', category = 'other', lat, lon, language = 'en' } = req.body;

      const latitude = Number(lat);
      const longitude = Number(lon);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({ error: 'Valid latitude and longitude are required' });
        return;
      }

      // Reverse geocode to locality and assign ward/city
      const geoInfo = reverseGeocodeLocality(latitude, longitude);

      // Run AI Image Classification if photo uploaded
      let aiResult = {
        predicted_category: category as any,
        confidence: 0.85,
        description_summary: description || 'Citizen reported pollution anomaly.',
        is_mock: true
      };

      // Transcribe voice note via Gemini multimodal audio (if provided)
      let voiceTranscript: string | null = null;
      if (voiceFile) {
        const audioBuffer = fs.readFileSync(voiceFile.path);
        const transcription = await transcribeAudioNote(audioBuffer, voiceFile.mimetype, language);
        voiceTranscript = transcription.transcript;
        console.log(`[Report] Voice note transcribed (mock=${transcription.is_mock}): "${voiceTranscript?.slice(0, 80)}"`);
      }

      // Translate description to English if non-English (for officer dashboard readability)
      let descriptionEn = description;
      if (language !== 'en' && description && description.trim().length > 3) {
        const translation = await translateToEnglish(description, language);
        descriptionEn = translation.translated_text;
        console.log(`[Report] Translated [${language}→en]: "${descriptionEn.slice(0, 80)}"`);
      }

      // Combine transcript into description if voice-only report
      const combinedDescription = voiceTranscript
        ? `${descriptionEn} [Voice: ${voiceTranscript}]`.trim()
        : descriptionEn;

      if (photoFile) {
        const buffer = fs.readFileSync(photoFile.path);
        aiResult = await classifyImage(buffer, photoFile.originalname, photoFile.mimetype, combinedDescription);
      }

      const id = crypto.randomUUID();
      const trackingId = `VV-${Math.floor(1000 + Math.random() * 9000)}`;
      const photoUrl = photoFile ? `/uploads/${photoFile.filename}` : null;
      const voiceUrl = voiceFile ? `/uploads/${voiceFile.filename}` : null;
      const userId = req.user?.id || null;
      const timestamp = new Date().toISOString();

      await execute(
        `INSERT INTO report (
          id, tracking_id, user_id, ward_id, city_id, category, description, language,
          photo_url, voice_url, lat, lon, ai_predicted_category, ai_confidence,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'new', $15, $16)`,
        [
          id, trackingId, userId, geoInfo.ward_id, geoInfo.city_id,
          aiResult.predicted_category || category,
          aiResult.description_summary || combinedDescription,
          language, photoUrl, voiceUrl, latitude, longitude,
          aiResult.predicted_category, aiResult.confidence,
          timestamp, timestamp
        ]
      );

      // Trigger Hotspot Scoring asynchronously
      runScoringJob().catch(err => console.error('Error running scoring after report submission:', err));

      res.status(201).json({
        message: 'Report submitted successfully',
        tracking_id: trackingId,
        locality_name: geoInfo.name,
        ward_id: geoInfo.ward_id,
        ai_classification: {
          predicted_category: aiResult.predicted_category,
          confidence: aiResult.confidence,
          description_summary: aiResult.description_summary,
          is_mock: aiResult.is_mock
        }
      });
    } catch (err) {
      console.error('Error submitting report:', err);
      res.status(500).json({ error: 'Failed to process pollution report' });
    }
  }
);

/**
 * GET /reports
 * Lists reports.
 * SECURITY REQUIREMENT: Public endpoints NEVER return phone numbers, emails, user IDs, or exact GPS coordinates.
 * Coordinates are rounded/snapped to grid centroid (2 decimal places ~1km) for public/citizen.
 */
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, window, ward_id, city_id } = req.query;

    // Enforce server-side ward isolation if authenticated user is an officer
    const enforcedWardId = getEnforcedWardId(req, ward_id as string);

    let sql = `SELECT * FROM report WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (enforcedWardId) {
      sql += ` AND ward_id = $${paramIndex++}`;
      params.push(enforcedWardId);
    }
    if (city_id) {
      sql += ` AND city_id = $${paramIndex++}`;
      params.push(city_id);
    }
    if (category && category !== 'all') {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (window === '24h') {
      const time = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(time);
    } else if (window === '7d') {
      const time = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(time);
    } else if (window === '30d') {
      const time = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(time);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const reports = await query(sql, params);

    const isPrivileged = req.user && (req.user.role === 'officer' || req.user.role === 'admin');

    const sanitizedReports = reports.map(r => {
      if (isPrivileged) {
        // Officers and Admins get full details and exact coordinates
        return r;
      } else {
        // Public / Citizens / Analysts: Strip PII and snap GPS coordinates
        return {
          id: r.id,
          tracking_id: r.tracking_id,
          category: r.category,
          description: r.description,
          language: r.language,
          photo_url: r.photo_url,
          // Snap latitude and longitude to 2 decimal places (~1.1km centroid grid) to protect reporter privacy
          lat: Math.round(Number(r.lat) * 100) / 100,
          lon: Math.round(Number(r.lon) * 100) / 100,
          ai_predicted_category: r.ai_predicted_category,
          ai_confidence: r.ai_confidence,
          status: r.status,
          action_taken: r.action_taken,
          created_at: r.created_at,
          updated_at: r.updated_at,
          locality_name: reverseGeocodeLocality(r.lat, r.lon).name
          // OMITTED: user_id, exact lat/lon, phone, email
        };
      }
    });

    res.status(200).json({ reports: sanitizedReports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * GET /reports/:tracking_id
 * Public tracking lookup by citizen tracking ID (e.g. #VV-1042)
 */
router.get('/:tracking_id', async (req: Request, res: Response): Promise<void> => {
  try {
    let trackingId = req.params.tracking_id;
    if (!trackingId.startsWith('VV-')) {
      trackingId = `VV-${trackingId}`;
    }

    const reports = await query('SELECT * FROM report WHERE tracking_id = $1', [trackingId]);
    const r = reports[0];

    if (!r) {
      res.status(404).json({ error: `Report with tracking ID ${trackingId} not found` });
      return;
    }

    const locality = reverseGeocodeLocality(r.lat, r.lon);

    res.status(200).json({
      report: {
        tracking_id: r.tracking_id,
        category: r.category,
        description: r.description,
        photo_url: r.photo_url,
        locality_name: locality.name,
        status: r.status,
        action_taken: r.action_taken || 'Complaint received. Awaiting municipal officer assignment.',
        created_at: r.created_at,
        updated_at: r.updated_at
      }
    });
  } catch (err) {
    console.error('Error lookup report:', err);
    res.status(500).json({ error: 'Failed to look up report' });
  }
});

export default router;
