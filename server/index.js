const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 3001;

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: './firebase-service-account.json'
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Enable CORS
app.use(cors());
app.use(express.json());

// Create preview endpoint
app.post('/api/create-preview', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create preview using sharp
    const preview = await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 30 })
      .toBuffer();

    // Convert to base64 for immediate response
    const base64Preview = `data:image/jpeg;base64,${preview.toString('base64')}`;
    
    res.json({ preview: base64Preview });
  } catch (error) {
    console.error('Preview creation error:', error);
    res.status(500).json({ error: 'Failed to create preview' });
  }
});

// Upload to Firebase Storage endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const timestamp = Date.now();
    const filename = `${timestamp}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const file = bucket.file(`tasks/${req.body.taskId}/${filename}`);

    // Upload the original file
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Get the public URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });

    res.json({
      success: true,
      url,
      name: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Delete from Firebase Storage endpoint
app.delete('/api/delete', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const filePath = url.split('/o/')[1].split('?')[0];
    const file = bucket.file(decodeURIComponent(filePath));
    
    await file.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 