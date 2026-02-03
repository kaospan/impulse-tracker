const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '50', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send(`<!doctype html>
  <html>
    <head><meta charset="utf-8"><title>IT → MP3</title></head>
    <body>
      <h1>Convert .it to MP3</h1>
      <form method="post" enctype="multipart/form-data" action="/convert">
        <input type="file" name="file" accept=".it" required />
        <button type="submit">Convert</button>
      </form>
      <p>Max upload: ${MAX_UPLOAD_MB} MB</p>
    </body>
  </html>`);
});

app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const inPath = req.file.path;
  const baseName = path.parse(req.file.originalname).name;
  const filename = baseName + '.mp3';

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // ffmpeg: decode .it (libopenmpt) and encode to mp3 (libmp3lame) to stdout
  const ff = spawn('ffmpeg', ['-y', '-i', inPath, '-vn', '-q:a', '2', '-f', 'mp3', 'pipe:1']);

  ff.stdout.pipe(res);

  ff.stderr.on('data', (d) => console.error('ffmpeg:', d.toString()));

  ff.on('close', async (code) => {
    try { await fs.unlink(inPath); } catch (e) { }
    if (code !== 0) {
      if (!res.headersSent) res.status(500).send('Conversion failed');
      else res.end();
    } else {
      res.end();
    }
  });

  ff.on('error', async (err) => {
    console.error('ffmpeg spawn error', err);
    try { await fs.unlink(inPath); } catch (e) { }
    if (!res.headersSent) res.status(500).send('Conversion failed');
  });
});

// ensure upload dir exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`IT→MP3 converter listening on :${PORT}`));
