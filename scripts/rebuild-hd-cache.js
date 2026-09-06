const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ROOT = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const MEDIA_ROOT = 'G:\\我的雲端硬碟\\112上-小教教學實習-20260830T083306Z-1-001\\112上-小教教學實習';
const FFMPEG = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const CACHE_DIR = path.join(PROJECT_ROOT, 'assets', 'thumb-cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data', 'practicum-data.json'), 'utf8'));

// Gather all items with thumbUrl
const tasks = new Map();

function walk(o) {
  if (!o) return;
  if (Array.isArray(o)) {
    o.forEach(walk);
  } else if (typeof o === 'object') {
    if (o.thumbUrl && o.relPath) {
      if (!tasks.has(o.thumbUrl)) {
        tasks.set(o.thumbUrl, o);
      }
    }
    for (let k in o) {
      walk(o[k]);
    }
  }
}

walk(data);
console.log(`Discovered ${tasks.size} unique thumbnails to generate.`);

const taskList = Array.from(tasks.values());

function convertItem(item) {
  return new Promise((resolve) => {
    let src = '';
    const localSrc = path.join(PROJECT_ROOT, item.relPath);
    const gSrc = path.join(MEDIA_ROOT, item.relPath);

    if (fs.existsSync(localSrc)) {
      src = localSrc;
    } else if (fs.existsSync(gSrc)) {
      src = gSrc;
    } else {
      console.warn(`[WARN] Source not found: ${item.relPath}`);
      return resolve({ success: false, reason: 'not_found', item });
    }

    const dest = path.join(PROJECT_ROOT, item.thumbUrl);
    const isVideo = item.isVideo || item.relPath.endsWith('.mp4');
    
    // Scale preserving aspect ratio inside 1280 max dimension, never upscaling
    const vf = "scale='if(gt(a,1),min(1280,iw),-2)':'if(gt(a,1),-2,min(1280,ih))'";
    
    let args = [];
    if (isVideo) {
      args = ['-y', '-ss', '00:00:01', '-i', src, '-vframes', '1', '-vf', vf, '-c:v', 'libwebp', '-quality', '82', dest];
    } else {
      args = ['-y', '-i', src, '-vf', vf, '-c:v', 'libwebp', '-quality', '82', dest];
    }

    const proc = spawn(FFMPEG, args, { stdio: 'ignore' });
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(dest)) {
        resolve({ success: true, item });
      } else {
        resolve({ success: false, reason: 'ffmpeg_error', code, item });
      }
    });
    proc.on('error', (err) => {
      resolve({ success: false, reason: 'spawn_error', err, item });
    });
  });
}

// Concurrency pool runner
async function run() {
  const CONCURRENCY = 8;
  let active = 0;
  let index = 0;
  let completed = 0;
  let failed = 0;
  const startTime = Date.now();

  return new Promise((resolve) => {
    function next() {
      if (completed + failed === taskList.length) {
        return resolve();
      }

      while (active < CONCURRENCY && index < taskList.length) {
        const item = taskList[index++];
        active++;

        convertItem(item).then((res) => {
          active--;
          if (res.success) {
            completed++;
          } else {
            failed++;
            console.error(`Failed: ${item.relPath} (${res.reason})`);
          }

          if ((completed + failed) % 100 === 0 || completed + failed === taskList.length) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`Progress: ${completed + failed} / ${taskList.length} (${completed} succeeded, ${failed} failed) [${elapsed}s]`);
          }

          next();
        });
      }
    }

    next();
  });
}

run().then(() => {
  console.log('--- Batch Conversion Completed ---');
  // Also copy high-res hero image for facebook post
  const heroSrc = path.join(PROJECT_ROOT, 'assets/52hz-ceremony/01_休業式全體大合照_師長與實習生比心齊聚.jpg');
  const heroDst = path.join(PROJECT_ROOT, 'assets/facebook-post/closing_ceremony_grand_photo.jpg');
  if (fs.existsSync(heroSrc)) {
    fs.copyFileSync(heroSrc, heroDst);
    console.log('Updated closing_ceremony_grand_photo.jpg to 2048px high-res original.');
  }
});
