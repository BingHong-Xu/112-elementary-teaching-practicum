const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const MEDIA_ROOT = process.env.MEDIA_ROOT || (fs.existsSync("G:\\我的雲端硬碟") ? "G:\\我的雲端硬碟\\112上-小教教學實習-20260830T083306Z-1-001\\112上-小教教學實習" : path.join(ROOT_DIR, 'assets'));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4'
};

function sendFile(filePath, req, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end('404 找不到檔案：' + filePath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Favicon
  if (pathname === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐋</text></svg>`);
    return;
  }

  // Handle /media/ if media from external disk requested
  if (pathname.startsWith('/media/')) {
    const mediaRel = pathname.substring('/media/'.length);
    const mediaPath = path.join(MEDIA_ROOT, mediaRel);
    if (fs.existsSync(mediaPath)) {
      sendFile(mediaPath, req, res);
      return;
    }
  }

  // Default to index.html
  if (pathname === '/') pathname = '/index.html';
  const localFile = path.join(ROOT_DIR, pathname);
  sendFile(localFile, req, res);
});

server.listen(PORT, () => {
  console.log('================================================================');
  console.log('🎉 112學年度小教教學實習（四維國小）v2 極速互動版伺服器已啟動！');
  console.log(`🌐 本機網址: http://localhost:${PORT}`);
  console.log('================================================================');
});
