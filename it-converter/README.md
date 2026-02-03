# IT → MP3 Converter

This small Node.js + Express app converts Impulse Tracker (.it) module files to MP3 using ffmpeg (requires a build of ffmpeg with libopenmpt).

## Run locally

```bash
cd it-converter
npm install
npm start
```

Then visit http://localhost:3000 to access the upload form.

## Docker

Build and run with Docker:

```bash
docker build -t it-converter:latest .
docker run -p 3000:3000 it-converter:latest
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 3000)
- `MAX_UPLOAD_MB` - Maximum upload file size in MB (default: 50)

Example:

```bash
PORT=8080 MAX_UPLOAD_MB=100 npm start
```

## Notes

- **Important**: ffmpeg must include libopenmpt support to decode .it files. The standard ffmpeg in most Linux distributions may not include this. If conversion fails, you may need to install or compile a version of ffmpeg with libopenmpt support.
- The app stores uploaded files temporarily in the `uploads/` directory and removes them after conversion.
- Converted MP3 files are streamed directly to the client and not stored on the server.

## API

### GET /

Returns an HTML upload form for converting .it files.

### POST /convert

Converts an uploaded .it file to MP3.

- **Content-Type**: `multipart/form-data`
- **Field name**: `file`
- **Accepted formats**: `.it`
- **Response**: MP3 audio file (audio/mpeg)

Example using curl:

```bash
curl -F "file=@mytrack.it" http://localhost:3000/convert -o mytrack.mp3
```
