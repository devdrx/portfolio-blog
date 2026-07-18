// YoRHa API Server — Express backend
// Persistent REST API server supporting SoundCloud proxy,
// posts, projects, media files storage, logs, and profile settings.
// Run: node server/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { Post, Project, Media, Setting, Log, Auth, OtakuRecord, seedDatabase } from './db.js';
import Jimp from 'jimp';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;

// ─── Session token signing ───────────────────────────────────────────────────
// Tokens are base64(payload) + '.' + HMAC-SHA256(payload, SESSION_SECRET), so a
// client can no longer forge an admin session by hand-crafting the base64 JSON.
if (!process.env.SESSION_SECRET) {
  console.warn('[SECURITY WARNING] SESSION_SECRET is not set in .env — using a random secret generated for this process. All admin sessions will be invalidated on every server restart. Set SESSION_SECRET in .env to avoid this.');
}
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex');

function signToken(payload) {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

// Returns the decoded payload if the token's signature is valid, otherwise null.
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

// SoundCloud config
const SC_USER_ID = 936751612;
const SC_API = 'https://api-v2.soundcloud.com';

// ─── Data persistence directories ─────────────────────────────────────────────
const DATA_DIR = join(__dirname, 'data');
const UPLOADS_DIR = join(DATA_DIR, 'uploads');

// Ensure database folders exist
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const WALLPAPERS_DIR = join(__dirname, '..', 'public', 'wallpapers');
if (!existsSync(WALLPAPERS_DIR)) mkdirSync(WALLPAPERS_DIR, { recursive: true });

const THUMBS_DIR = join(WALLPAPERS_DIR, 'thumbs');
if (!existsSync(THUMBS_DIR)) mkdirSync(THUMBS_DIR, { recursive: true });

const SONGS_DIR = join(__dirname, '..', 'public', 'songs');
if (!existsSync(SONGS_DIR)) mkdirSync(SONGS_DIR, { recursive: true });

// ─── Multer upload middleware ──────────────────────────────────────────────────
const ALLOWED_UPLOAD_MIME_TYPES = /^image\/(jpeg|png|gif|webp|svg\+xml)$/;
const ALLOWED_UPLOAD_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique name while preserving original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard cap, enforced server-side
  fileFilter: (req, file, cb) => {
    // Client-side "accept=image/*" and size checks are cosmetic only — verify
    // both the declared mimetype and file extension here before accepting.
    if (ALLOWED_UPLOAD_MIME_TYPES.test(file.mimetype) && ALLOWED_UPLOAD_EXTENSIONS.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only image uploads (jpg, png, gif, webp, svg) are permitted.'));
    }
  }
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', /\.vercel\.app$/, /\.netlify\.app$/],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(express.json({ limit: '10mb' }));

// Static file serving of uploads directory
app.use('/api/uploads', express.static(UPLOADS_DIR));
app.use('/wallpapers', express.static(WALLPAPERS_DIR));
app.use('/songs', express.static(SONGS_DIR));

// Auth verification middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Session token missing.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Malformed session token.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.exp || Date.now() > decoded.exp || decoded.role !== 'admin') {
    return res.status(401).json({ error: 'UNAUTHORIZED: Session expired or invalid.' });
  }
  next();
};

// ─── POSTS REST ENDPOINTS ─────────────────────────────────────────────────────
app.get('/api/posts', async (req, res) => {
  try {
    const filter = req.query.drafts !== 'true' ? { status: { $ne: 'draft' } } : {};
    const posts = await Post.find(filter).sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', authenticate, async (req, res) => {
  try {
    const newPost = await Post.create({
      ...req.body,
      _id: `post-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    });
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', authenticate, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/bulk/status', authenticate, async (req, res) => {
  try {
    const { ids, status } = req.body;
    await Post.updateMany({ _id: { $in: ids } }, { $set: { status } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/bulk/delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    await Post.deleteMany({ _id: { $in: ids } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROJECTS REST ENDPOINTS ──────────────────────────────────────────────────
app.get('/api/projects', async (req, res) => {
  try {
    const filter = req.query.hidden !== 'true' ? { visibility: 'visible' } : {};
    const list = await Project.find(filter).sort({ order: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', authenticate, async (req, res) => {
  try {
    const newProject = await Project.create({
      ...req.body,
      _id: `proj-${Date.now()}`
    });
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Project not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MEDIA ENDPOINTS (Multer Binary Storage) ─────────────────────────────────
app.get('/api/media', async (req, res) => {
  try {
    const media = await Media.find().sort({ uploadedAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/media', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const newMedia = await Media.create({
      _id: `media-${Date.now()}`,
      name: req.file.originalname,
      url: `/api/uploads/${req.file.filename}`,
      size: Math.round((req.file.size / 1024) * 100) / 100, // KB
      type: req.file.mimetype,
      uploadedAt: new Date().toISOString().split('T')[0]
    });
    res.status(201).json(newMedia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/media/:id', authenticate, async (req, res) => {
  try {
    const file = await Media.findById(req.params.id);
    if (file) {
      // Delete physical file from disk if it was uploaded locally
      if (file.url.startsWith('/api/uploads/')) {
        // basename() strips any directory components (e.g. "../../etc/passwd"),
        // so a crafted url (via /api/system/import, which accepts arbitrary
        // media records) can't be used to delete files outside UPLOADS_DIR.
        const filename = basename(file.url.replace('/api/uploads/', '').split('?')[0]);
        const filePath = join(UPLOADS_DIR, filename);
        try {
          if (existsSync(filePath)) unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting file from disk:', err);
        }
      }
      await Media.findByIdAndDelete(req.params.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── OTAKU RECORDS ENDPOINTS ──────────────────────────────────────────────────
app.get('/api/otaku', async (req, res) => {
  try {
    const records = await OtakuRecord.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/otaku', authenticate, async (req, res) => {
  try {
    const newRecord = await OtakuRecord.create({
      ...req.body,
      _id: `otaku-${Date.now()}`
    });
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/otaku/:id', authenticate, async (req, res) => {
  try {
    const updated = await OtakuRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Otaku record not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/otaku/:id', authenticate, async (req, res) => {
  try {
    await OtakuRecord.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SYSTEM LOGS ENDPOINTS ────────────────────────────────────────────────────
app.get('/api/logs', authenticate, async (req, res) => {
  try {
    const logs = await Log.find().sort({ _id: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Not gated by authenticate(): this records security-relevant events (failed
// login attempts, logout) that by definition happen without a valid admin
// session. Entry count is capped at 120 below to bound abuse from spam.
app.post('/api/logs', async (req, res) => {
  try {
    const newLog = await Log.create({
      _id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8),
      ...req.body
    });
    // Trim logs database to 120 entries to prevent endless growth
    const logCount = await Log.countDocuments();
    if (logCount > 120) {
      const oldestDocs = await Log.find().sort({ _id: 1 }).limit(20);
      const oldestIds = oldestDocs.map(d => d._id);
      await Log.deleteMany({ _id: { $in: oldestIds } });
    }
    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logs', authenticate, async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SETTINGS ENDPOINTS ───────────────────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Setting.findById('settings-global');
    if (!settings) {
      settings = await Setting.create({ _id: 'settings-global' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', authenticate, async (req, res) => {
  try {
    const updated = await Setting.findByIdAndUpdate(
      'settings-global',
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile picture upload endpoint
app.post('/api/settings/pfp', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    let settings = await Setting.findById('settings-global');
    if (!settings) {
      settings = await Setting.create({ _id: 'settings-global' });
    }

    // Delete old pfp file if it was locally uploaded
    if (settings.pfpUrl && settings.pfpUrl.startsWith('/api/uploads/')) {
      const oldFilename = basename(settings.pfpUrl.split('?')[0].replace('/api/uploads/', ''));
      const oldFilePath = join(UPLOADS_DIR, oldFilename);
      try {
        if (existsSync(oldFilePath)) unlinkSync(oldFilePath);
      } catch {}
    }

    const newPfpUrl = `/api/uploads/${req.file.filename}?t=${Date.now()}`;
    settings.pfpUrl = newPfpUrl;
    await settings.save();

    res.json({ pfpUrl: newPfpUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Write backup checkpoint
app.post('/api/settings/backup', authenticate, async (req, res) => {
  try {
    const updated = await Setting.findByIdAndUpdate(
      'settings-global',
      { $set: { lastBackup: new Date().toLocaleString() } },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aggregate stats endpoint
app.get('/api/settings/stats', authenticate, async (req, res) => {
  try {
    const publishedCount = await Post.countDocuments({ status: { $ne: 'draft' } });
    const draftsCount = await Post.countDocuments({ status: 'draft' });
    const projectsCount = await Project.countDocuments();
    const mediaList = await Media.find();
    
    let settings = await Setting.findById('settings-global');
    if (!settings) {
      settings = await Setting.create({ _id: 'settings-global' });
    }

    const totalSizeKB = mediaList.reduce((acc, item) => acc + (item.size || 0), 0);
    const healthStatus = draftsCount > 5 ? 'DEGRADED (HIGH DRAFT VOLUMES)' : 'OPTIMAL';
    const otakuRecordsCount = await OtakuRecord.countDocuments();

    res.json({
      postsCount: publishedCount,
      draftsCount,
      projectsCount,
      mediaCount: mediaList.length,
      mediaSizeKB: Math.round(totalSizeKB),
      health: healthStatus,
      lastBackup: settings.lastBackup,
      otakuCount: otakuRecordsCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full reset endpoint (factory restore)
app.post('/api/system/reset', authenticate, async (req, res) => {
  try {
    // Clear collections
    await Post.deleteMany({});
    await Project.deleteMany({});
    await Media.deleteMany({});
    await Log.deleteMany({});
    await Setting.deleteMany({});
    await Auth.deleteMany({});

    // Seed defaults
    await seedDatabase();

    // Clear all local uploaded files in the uploads folder
    try {
      const files = readdirSync(UPLOADS_DIR);
      for (const file of files) {
        unlinkSync(join(UPLOADS_DIR, file));
      }
    } catch (err) {
      console.error('Error cleaning uploads dir:', err);
    }

    console.log('[SYSTEM] Database reset to default configurations.');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AUTHENTICATION ENDPOINTS ──────────────────────────────────────────────────
app.get('/api/auth/status', async (req, res) => {
  try {
    let auth = await Auth.findById('auth-global');
    if (!auth) {
      auth = await Auth.create({ _id: 'auth-global' });
    }
    res.json({ initialized: !!auth.isInitialized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/setup', async (req, res) => {
  try {
    let auth = await Auth.findById('auth-global');
    if (!auth) {
      auth = await Auth.create({ _id: 'auth-global' });
    }
    if (auth.isInitialized) {
      return res.status(400).json({ error: 'SYSTEM ERROR: Security database already initialized.' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'INVALID KEY: Access key must be at least 6 characters.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    auth.isInitialized = true;
    auth.adminPasswordHash = hash;
    await auth.save();

    // Signed session token (expires in 2 hours)
    const token = signToken({
      userId: 'admin',
      role: 'admin',
      exp: Date.now() + 2 * 60 * 60 * 1000
    });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    let auth = await Auth.findById('auth-global');
    if (!auth || !auth.isInitialized) {
      return res.status(400).json({ error: 'INITIALIZATION_REQUIRED: Setup master access key first.' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'INVALID REQUEST: Password required.' });
    }

    const matches = bcrypt.compareSync(password, auth.adminPasswordHash);
    if (matches) {
      const token = signToken({
        userId: 'admin',
        role: 'admin',
        exp: Date.now() + 2 * 60 * 60 * 1000
      });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'SECURITY REJECTION: Access key mismatch.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Session token missing.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Malformed session token.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.exp || Date.now() > decoded.exp || decoded.role !== 'admin') {
    return res.status(401).json({ error: 'UNAUTHORIZED: Session expired or invalid.' });
  }

  try {
    let auth = await Auth.findById('auth-global');
    if (!auth || !auth.isInitialized) {
      return res.status(401).json({ error: 'UNAUTHORIZED: Security database not initialized.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'INVALID REQUEST: Missing parameter inputs.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'INVALID KEY: New key must be at least 6 characters.' });
    }

    const matches = bcrypt.compareSync(currentPassword, auth.adminPasswordHash);
    if (!matches) {
      return res.status(400).json({ error: 'SECURITY REJECTION: Current key is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    auth.adminPasswordHash = hash;
    await auth.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export entire bundle
app.get('/api/system/export', authenticate, async (req, res) => {
  try {
    const posts = await Post.find();
    const projects = await Project.find();
    const media = await Media.find();

    res.json({
      posts,
      projects,
      media,
      exportedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import entire bundle
app.post('/api/system/import', authenticate, async (req, res) => {
  try {
    const { posts, projects, media } = req.body;
    if (posts) {
      await Post.deleteMany({});
      await Post.insertMany(posts);
    }
    if (projects) {
      await Project.deleteMany({});
      await Project.insertMany(projects);
    }
    if (media) {
      await Media.deleteMany({});
      await Media.insertMany(media);
    }

    console.log('[SYSTEM] Database configurations imported successfully.');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SOUNDCLOUD PROXY ─────────────────────────────────────────────────────────
app.get('/api/soundcloud/likes', async (req, res) => {
  if (!CLIENT_ID) {
    return res.status(503).json({ error: 'SOUNDCLOUD_CLIENT_ID is not set. Add it to .env and restart the server.' });
  }
  try {
    const url = `${SC_API}/users/${SC_USER_ID}/likes?client_id=${CLIENT_ID}&limit=10&linked_partitioning=1`;
    const scRes = await fetch(url);
    if (!scRes.ok) {
      const text = await scRes.text();
      return res.status(scRes.status).json({ error: `SoundCloud API ${scRes.status}: ${text.slice(0, 200)}` });
    }
    const data = await scRes.json();
    const tracks = (data.collection || [])
      .filter(item => item.track && item.track.kind === 'track' && item.track.streamable)
      .map(item => {
        const t = item.track;
        return {
          id: t.id,
          title: t.title,
          artist: t.publisher_metadata?.artist || t.user?.username || 'Unknown',
          artwork: t.artwork_url ? t.artwork_url.replace('-large', '-t300x300') : null,
          url: t.permalink_url,
          plays: t.playback_count ?? 0,
          likes: t.likes_count ?? 0,
          duration: t.full_duration || t.duration || 0,
        };
      })
      .slice(0, 5);
    res.json({ tracks, fetched_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/soundcloud/stats', async (req, res) => {
  if (!CLIENT_ID) return res.status(503).json({ error: 'SOUNDCLOUD_CLIENT_ID is not set.' });
  try {
    const url = `${SC_API}/users/${SC_USER_ID}?client_id=${CLIENT_ID}`;
    const scRes = await fetch(url);
    if (!scRes.ok) {
      const text = await scRes.text();
      return res.status(scRes.status).json({ error: `SoundCloud API ${scRes.status}: ${text.slice(0, 200)}` });
    }
    const user = await scRes.json();
    res.json({
      username: user.permalink, display_name: user.full_name,
      followers: user.followers_count, following: user.followings_count,
      tracks: user.track_count, playlists: user.playlist_count,
      likes: user.likes_count, avatar: user.avatar_url,
      url: user.permalink_url, city: user.city, country: user.country_code,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WALLPAPERS SCANNING ENDPOINT ─────────────────────────────────────────────
app.get('/api/wallpapers', (req, res) => {
  try {
    if (!existsSync(WALLPAPERS_DIR)) {
      return res.json([]);
    }
    const files = readdirSync(WALLPAPERS_DIR)
      .filter(file => file !== 'thumbs' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));

    let hasMissingThumbs = false;
    const result = files.map(file => {
      // Jimp can't rasterize SVG, so it never gets a generated thumbnail —
      // serve the original in its place instead of retrying forever.
      const isSvg = /\.svg$/i.test(file);
      const thumbExists = isSvg || existsSync(join(THUMBS_DIR, file));
      if (!thumbExists) hasMissingThumbs = true;
      return {
        original: `/wallpapers/${file}`,
        thumbnail: isSvg ? `/wallpapers/${file}` : (thumbExists ? `/wallpapers/thumbs/${file}` : null) // null indicates it is being generated
      };
    });

    res.json(result);

    // Generate missing thumbnails asynchronously in the background
    if (hasMissingThumbs) {
      files.filter(file => !/\.svg$/i.test(file)).forEach(async (file) => {
        const originalPath = join(WALLPAPERS_DIR, file);
        const thumbPath = join(THUMBS_DIR, file);
        if (!existsSync(thumbPath)) {
          try {
            const image = await Jimp.read(originalPath);
            await image.resize(500, Jimp.AUTO).quality(80).writeAsync(thumbPath);
            console.log(`[SYSTEM] Asynchronously generated thumbnail for: ${file}`);
          } catch (err) {
            console.error(`[SYSTEM] Failed generating thumbnail for ${file}:`, err.message);
          }
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SONGS SCANNING ENDPOINT ──────────────────────────────────────────────────
app.get('/api/songs', (req, res) => {
  try {
    if (!existsSync(SONGS_DIR)) {
      return res.json([]);
    }
    const files = readdirSync(SONGS_DIR)
      .filter(file => /\.(mp3|wav|ogg|m4a)$/i.test(file))
      .map(file => {
        const name = file.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        return {
          title: name.charAt(0).toUpperCase() + name.slice(1),
          url: `/songs/${file}`
        };
      });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    server: 'YoRHa API v2.0',
    sc_key_configured: !!CLIENT_ID,
    timestamp: new Date().toISOString(),
  });
});

// Serve static client assets in production
const DIST_DIR = join(__dirname, '..', 'dist');
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    // Return index.html for client-side single-page app routing, but only for
    // routes (no file extension) — a missing static asset (.js, .png, etc.)
    // should still 404 instead of silently getting served an HTML document.
    if (!req.path.startsWith('/api') && req.method === 'GET' && !extname(req.path)) {
      res.sendFile(join(DIST_DIR, 'index.html'));
    } else {
      next();
    }
  });
}

// Scan all wallpapers and pre-generate missing thumbnails on boot
const generateAllThumbnails = async () => {
  console.log('[DATABASE] Scanning wallpapers for missing thumbnails...');
  try {
    if (!existsSync(WALLPAPERS_DIR)) return;
    // SVG excluded — Jimp can't rasterize it, so it never needs a thumbnail.
    const files = readdirSync(WALLPAPERS_DIR)
      .filter(file => file !== 'thumbs' && /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

    for (const file of files) {
      const originalPath = join(WALLPAPERS_DIR, file);
      const thumbPath = join(THUMBS_DIR, file);
      if (!existsSync(thumbPath)) {
        try {
          console.log(`[DATABASE] Pre-generating thumbnail: ${file}`);
          const image = await Jimp.read(originalPath);
          await image.resize(500, Jimp.AUTO).quality(80).writeAsync(thumbPath);
        } catch (err) {
          console.error(`[DATABASE] Failed generating thumbnail for ${file}:`, err.message);
        }
      }
    }
    console.log('[DATABASE] Thumbnail scan completed.');
  } catch (err) {
    console.error('[DATABASE] Thumbnail scan failed:', err.message);
  }
};

// Catch multer upload rejections (bad file type / too large) and report as JSON
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `UPLOAD_ERROR: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'UPLOAD_ERROR: Invalid file.' });
  }
  next();
});

app.listen(PORT, async () => {
  // Boot check: populate database tables if empty
  await seedDatabase();

  // Pre-generate thumbnails so clients load fast
  await generateAllThumbnails();

  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║  YoRHa API Server v2.0 — ONLINE      ║`);
  console.log(`  ║  http://localhost:${PORT}               ║`);
  console.log(`  ║  SC key: ${CLIENT_ID ? '✓ configured     ' : '✗ MISSING in .env'}     ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
});
