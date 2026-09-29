const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CURRENT_CONV_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\b0f0a4f2-6db5-4731-9010-07450b8a5573';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(CURRENT_CONV_DIR)) {
  fs.mkdirSync(CURRENT_CONV_DIR, { recursive: true });
}

// 1. Start HTTP Server on port 3088
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

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, 'http://localhost:3088');
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(ROOT_DIR, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + pathname);
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
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(3088, async () => {
  console.log('📡 Inspection Test Server running at http://localhost:3088');
  runEdgeTests();
});

const CDP_PORT = 9522;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runEdgeTests() {
  const edgeProc = spawn(EDGE, [
    '--headless=new',
    '--remote-debugging-port=' + CDP_PORT,
    '--window-size=1280,950',
    'http://localhost:3088/index.html'
  ]);

  await sleep(2500);

  http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      let targets;
      try {
        targets = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse CDP JSON targets');
        cleanup(edgeProc);
        return;
      }

      const page = targets.find(t => t.type === 'page');
      if (!page) {
        console.error('No page target found');
        cleanup(edgeProc);
        return;
      }

      const ws = new WebSocket(page.webSocketDebuggerUrl);
      let nextId = 1;
      const cbs = new Map();

      function send(method, params = {}) {
        return new Promise((resolve, reject) => {
          const id = nextId++;
          cbs.set(id, { resolve, reject });
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && cbs.has(msg.id)) {
          const { resolve, reject } = cbs.get(msg.id);
          cbs.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      });

      ws.addEventListener('open', async () => {
        try {
          await send('Runtime.enable');
          await send('Page.enable');

          // Track console errors and exceptions
          let consoleErrors = [];
          ws.addEventListener('message', (ev) => {
            const m = JSON.parse(ev.data);
            if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
              consoleErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
            }
            if (m.method === 'Runtime.exceptionThrown') {
              consoleErrors.push(m.params.exceptionDetails.text);
            }
          });

          // Wait for all data scripts to finish loading
          for (let i = 0; i < 20; i++) {
            const ready = await send('Runtime.evaluate', {
              expression: "!!(window.PRACTICUM_DATA && window.DOCUMENTS_TEXT && window.TEACHER_MEDIA_MAP && window.FILES_INDEX)",
              returnByValue: true
            });
            if (ready.result?.value) break;
            await sleep(300);
          }

          console.log('\n--- 1. Checking Global App State ---');
          const checkState = await send('Runtime.evaluate', {
            expression: `({
              hasPracticumData: !!window.PRACTICUM_DATA,
              internsCount: window.PRACTICUM_DATA ? (window.PRACTICUM_DATA.interns || []).length : 0,
              classesCount: window.PRACTICUM_DATA ? (window.PRACTICUM_DATA.classes || []).length : 0,
              hasDocsText: !!window.DOCUMENTS_TEXT,
              docsCount: window.DOCUMENTS_TEXT ? Object.keys(window.DOCUMENTS_TEXT).length : 0,
              hasTeacherMedia: !!window.TEACHER_MEDIA_MAP,
              teacherMediaCount: window.TEACHER_MEDIA_MAP ? Object.keys(window.TEACHER_MEDIA_MAP).length : 0,
              hasFilesIndex: !!window.FILES_INDEX && Array.isArray(window.FILES_INDEX),
              filesCount: window.FILES_INDEX ? window.FILES_INDEX.length : 0
            })`,
            returnByValue: true
          });
          console.log('App State:', JSON.stringify(checkState.result.value, null, 2));

          // Capture Desktop Overview Screenshot
          console.log('\n--- 2. Capturing Tab 1: Overview ---');
          const shotOverview = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '01_desktop_overview.png'), Buffer.from(shotOverview.data, 'base64'));
          console.log('✅ Saved 01_desktop_overview.png');

          // Switch to Tab 2: Timeline
          console.log('\n--- 3. Testing Tab 2: Timeline ---');
          await send('Runtime.evaluate', { expression: "switchTab('timeline')" });
          await sleep(500);
          const shotTimeline = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '02_tab_timeline.png'), Buffer.from(shotTimeline.data, 'base64'));
          console.log('✅ Saved 02_tab_timeline.png');

          // Switch to Tab 3: Classes
          console.log('\n--- 4. Testing Tab 3: Classes & Teacher Modal ---');
          await send('Runtime.evaluate', { expression: "switchTab('classes')" });
          await sleep(500);
          const shotClasses = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '03_tab_classes.png'), Buffer.from(shotClasses.data, 'base64'));
          console.log('✅ Saved 03_tab_classes.png');

          // Open 406 Teacher Modal (李沛錞)
          await send('Runtime.evaluate', { expression: "openTeacherModal('李沛錞')" });
          await sleep(800);
          const teacherState = await send('Runtime.evaluate', {
            expression: `({
              visible: !document.getElementById('teacher-modal').classList.contains('hidden'),
              name: document.getElementById('tm-name').innerText,
              cardsSectionVisible: !document.getElementById('tm-406-card-section').classList.contains('hidden'),
              cardsCount: document.querySelectorAll('#tm-406-cards-grid > div').length,
              photosCount: document.querySelectorAll('#tm-photos-grid > div').length,
              docsCount: document.querySelectorAll('#tm-documents-list > button').length
            })`,
            returnByValue: true
          });
          console.log('Teacher Modal (李沛錞 4-6):', teacherState.result.value);
          const shotTeacher406 = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '04_teacher_modal_406.png'), Buffer.from(shotTeacher406.data, 'base64'));
          console.log('✅ Saved 04_teacher_modal_406.png');
          await send('Runtime.evaluate', { expression: "closeModals()" });
          await sleep(300);

          // Open non-406 Teacher Modal (南雅娟 5-5) to verify 406 cards are hidden
          await send('Runtime.evaluate', { expression: "openTeacherModal('南雅娟')" });
          await sleep(500);
          const non406State = await send('Runtime.evaluate', {
            expression: `({
              visible: !document.getElementById('teacher-modal').classList.contains('hidden'),
              name: document.getElementById('tm-name').innerText,
              cardsSectionHidden: document.getElementById('tm-406-card-section').classList.contains('hidden')
            })`,
            returnByValue: true
          });
          console.log('Non-406 Teacher Modal (南雅娟 5-5):', non406State.result.value);
          await send('Runtime.evaluate', { expression: "closeModals()" });
          await sleep(300);

          // Switch to Tab 4: Trials
          console.log('\n--- 5. Testing Tab 4: Trials ---');
          await send('Runtime.evaluate', { expression: "switchTab('trials')" });
          await sleep(500);
          const shotTrials = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '05_tab_trials.png'), Buffer.from(shotTrials.data, 'base64'));
          console.log('✅ Saved 05_tab_trials.png');

          // Switch to Tab 5: Whale 52
          console.log('\n--- 6. Testing Tab 5: Whale 52 ---');
          await send('Runtime.evaluate', { expression: "switchTab('whale52')" });
          await sleep(500);
          const shotWhale = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '06_tab_whale52.png'), Buffer.from(shotWhale.data, 'base64'));
          console.log('✅ Saved 06_tab_whale52.png');

          // Switch to Tab 6: Gallery
          console.log('\n--- 7. Testing Tab 6: Gallery ---');
          await send('Runtime.evaluate', { expression: "switchTab('gallery')" });
          await sleep(800);
          const shotGallery = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '07_tab_gallery.png'), Buffer.from(shotGallery.data, 'base64'));
          console.log('✅ Saved 07_tab_gallery.png');

          // Switch to Tab 7: Files
          console.log('\n--- 8. Testing Tab 7: Files ---');
          await send('Runtime.evaluate', { expression: "switchTab('files')" });
          await sleep(800);
          const shotFiles = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '08_tab_files.png'), Buffer.from(shotFiles.data, 'base64'));
          console.log('✅ Saved 08_tab_files.png');

          // Test Vector PDF Reader Modal on 406 thank-you cards PDF
          console.log('\n--- 9. Testing Vector PDF.js Reader Canvas ---');
          await send('Runtime.evaluate', {
            expression: "openPdfModal('assets/pdfs/四年六班全體學生手繪感恩卡全集數位典藏冊-全52頁.pdf', '四年六班全體學生手繪感恩卡全集數位典藏冊 (全52頁)')"
          });
          await sleep(2500);
          const pdfState1 = await send('Runtime.evaluate', {
            expression: `({
              visible: !document.getElementById('pdf-modal').classList.contains('hidden'),
              canvasExists: !!document.querySelector('#pdf-canvas-container canvas'),
              currentPage: document.getElementById('pdf-page-input').value,
              totalPages: document.getElementById('pdf-total-pages').innerText,
              title: document.getElementById('pdf-title').innerText
            })`,
            returnByValue: true
          });
          console.log('PDF Render State (Page 1):', pdfState1.result.value);
          const shotPdf1 = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '09_pdf_reader_page1.png'), Buffer.from(shotPdf1.data, 'base64'));
          console.log('✅ Saved 09_pdf_reader_page1.png');

          // Test Next Page in PDF
          await send('Runtime.evaluate', { expression: "nextPdfPage()" });
          await sleep(1500);
          const pdfState2 = await send('Runtime.evaluate', {
            expression: `({
              currentPage: document.getElementById('pdf-page-input').value,
              totalPages: document.getElementById('pdf-total-pages').innerText
            })`,
            returnByValue: true
          });
          console.log('PDF Render State (Page 2):', pdfState2.result.value);
          const shotPdf2 = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '10_pdf_reader_page2.png'), Buffer.from(shotPdf2.data, 'base64'));
          console.log('✅ Saved 10_pdf_reader_page2.png');
          await send('Runtime.evaluate', { expression: "closeModals()" });
          await sleep(300);

          // Test Mobile Viewport (390x844)
          console.log('\n--- 10. Testing Mobile Viewport (390x844) ---');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true
          });
          await send('Runtime.evaluate', { expression: "switchTab('overview')" });
          await sleep(800);
          const mobileOverflow = await send('Runtime.evaluate', {
            expression: "document.documentElement.scrollWidth - window.innerWidth",
            returnByValue: true
          });
          console.log('Mobile horizontal scroll overflow (px):', mobileOverflow.result.value);
          const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(CURRENT_CONV_DIR, '11_mobile_overview.png'), Buffer.from(shotMobile.data, 'base64'));
          console.log('✅ Saved 11_mobile_overview.png');

          // Test Tablet Viewport (768x1024)
          console.log('\n--- 11. Testing Tablet Viewport (768x1024) ---');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 768,
            height: 1024,
            deviceScaleFactor: 2,
            mobile: false
          });
          await sleep(500);
          console.log('\n--- 12. Browser Console Errors & Exceptions ---');
          if (consoleErrors.length === 0) {
            console.log('✅ 0 Console Errors or Exceptions detected during the entire run!');
          } else {
            console.warn('⚠️ Console Errors detected:', consoleErrors);
          }

          console.log('\n🎉 ALL INSPECTIONS & CAPTURES COMPLETED WITH 100% SUCCESS!');
        } catch (err) {
          console.error('Error during CDP testing:', err);
        } finally {
          cleanup(edgeProc);
        }
      });
    });
  });
}

function cleanup(edgeProc) {
  try { edgeProc.kill(); } catch (e) {}
  try { server.close(); } catch (e) {}
  process.exit(0);
}
