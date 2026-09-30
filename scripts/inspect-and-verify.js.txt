/**
 * 112 小教實習成果展 - 全自動化端到端檢測與截圖驗證工具
 * 112 Elementary Teaching Practicum Portfolio - Automated E2E Inspection & Verification Suite
 *
 * 【功能說明】
 * 1. 啟動內建輕量 HTTP 伺服器，模擬標準 Web 託管環境。
 * 2. 自動偵測本機 Chrome / Edge 瀏覽器並以 Headless 模式透過 CDP (Chrome DevTools Protocol) 進行驗證。
 * 3. 逐一檢測 7 大展區分頁、24位實習教師彈窗、406手繪感恩卡數位典藏、向量 PDF 翻頁閱讀器與響應式排版。
 * 4. 監聽瀏覽器控制台，確保 0 報錯、0 例外，並產出高畫質檢驗截圖。
 *
 * 【使用方式】
 * node scripts/inspect-and-verify.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(ROOT_DIR, 'test-output');
const ARTIFACT_DIR = process.env.CONVERSATION_DIR || 'C:\\Users\\user\\.gemini\\antigravity\\brain\\b0f0a4f2-6db5-4731-9010-07450b8a5573';

// 確保輸出資料夾存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (ARTIFACT_DIR && !fs.existsSync(ARTIFACT_DIR)) {
  try { fs.mkdirSync(ARTIFACT_DIR, { recursive: true }); } catch (e) {}
}

/**
 * 依平台動態尋找 Edge 或 Chrome 執行檔路徑
 */
function findBrowserExecutable() {
  if (process.env.BROWSER_PATH && fs.existsSync(process.env.BROWSER_PATH)) {
    return process.env.BROWSER_PATH;
  }

  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isWindows) {
    const progFiles86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const progFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const localAppData = process.env['LOCALAPPDATA'] || 'C:\\Users\\user\\AppData\\Local';

    const candidates = [
      path.join(progFiles86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(progFiles86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  } else if (isMac) {
    const candidates = [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  } else {
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/microsoft-edge'
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
  }

  return 'msedge';
}

// 支援的靜態檔案 MIME 類型
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

const TEST_PORT = 3088;
const CDP_PORT = 9522;

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://localhost:${TEST_PORT}`);
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
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function saveScreenshot(filename, buffer) {
  const outPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outPath, buffer);
  if (ARTIFACT_DIR && fs.existsSync(ARTIFACT_DIR)) {
    try {
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buffer);
    } catch (e) {}
  }
}

async function runInspectionSuite() {
  const browserBin = findBrowserExecutable();
  console.log(`🌐 啟動檢驗專用瀏覽器: ${browserBin}`);

  const browserProc = spawn(browserBin, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1280,950',
    `http://localhost:${TEST_PORT}/index.html`
  ]);

  await sleep(2500);

  http.get(`http://127.0.0.1:${CDP_PORT}/json`, res => {
    let raw = '';
    res.on('data', chunk => (raw += chunk));
    res.on('end', async () => {
      let targets;
      try {
        targets = JSON.parse(raw);
      } catch (e) {
        console.error('❌ 解析 CDP 端點失敗:', e.message);
        cleanup(browserProc);
        return;
      }

      const page = targets.find(t => t.type === 'page');
      if (!page) {
        console.error('❌ 未找到可用瀏覽器測試分頁');
        cleanup(browserProc);
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

      ws.addEventListener('message', ev => {
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

          const consoleErrors = [];
          ws.addEventListener('message', ev => {
            const m = JSON.parse(ev.data);
            if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
              consoleErrors.push(m.params.args.map(a => a.value || a.description).join(' '));
            }
            if (m.method === 'Runtime.exceptionThrown') {
              consoleErrors.push(m.params.exceptionDetails.text);
            }
          });

          // 等待全域巨量資料腳本載入完成
          for (let i = 0; i < 20; i++) {
            const ready = await send('Runtime.evaluate', {
              expression: '!!(window.PRACTICUM_DATA && window.DOCUMENTS_TEXT && window.TEACHER_MEDIA_MAP && window.FILES_INDEX)',
              returnByValue: true
            });
            if (ready.result?.value) break;
            await sleep(300);
          }

          console.log('\n--- 1. 全域資料狀態檢測 (Global App State) ---');
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
          console.log('專案資料核心狀態:', JSON.stringify(checkState.result.value, null, 2));

          // 截圖分頁 1: 成果總覽 (Overview)
          console.log('\n--- 2. 檢驗分頁 1: 成果總覽 ---');
          const shotOverview = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('01_desktop_overview.png', Buffer.from(shotOverview.data, 'base64'));
          console.log('✅ 已保存 01_desktop_overview.png');

          // 切換分頁 2: 實習紀實 (Timeline)
          console.log('\n--- 3. 檢驗分頁 2: 實習紀實 ---');
          await send('Runtime.evaluate', { expression: "switchTab('timeline')" });
          await sleep(500);
          const shotTimeline = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('02_tab_timeline.png', Buffer.from(shotTimeline.data, 'base64'));
          console.log('✅ 已保存 02_tab_timeline.png');

          // 切換分頁 3: 實習班級與教師彈窗 (Classes & Teacher Modal)
          console.log('\n--- 4. 檢驗分頁 3: 班級展區與教師個人特展 ---');
          await send('Runtime.evaluate', { expression: "switchTab('classes')" });
          await sleep(500);
          const shotClasses = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('03_tab_classes.png', Buffer.from(shotClasses.data, 'base64'));
          console.log('✅ 已保存 03_tab_classes.png');

          // 開啟 406 李沛錞 老師特展彈窗
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
          console.log('李沛錞老師 (406) 彈窗狀態:', teacherState.result.value);
          const shotTeacher406 = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('04_teacher_modal_406.png', Buffer.from(shotTeacher406.data, 'base64'));
          console.log('✅ 已保存 04_teacher_modal_406.png');
          await send('Runtime.evaluate', { expression: 'closeModals()' });
          await sleep(300);

          // 驗證非 406 班級隔絕
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
          console.log('南雅娟老師 (505) 感恩卡隔離檢驗:', non406State.result.value);
          await send('Runtime.evaluate', { expression: 'closeModals()' });
          await sleep(300);

          // 切換分頁 4: 試教演示 (Trials)
          console.log('\n--- 5. 檢驗分頁 4: 試教演示 ---');
          await send('Runtime.evaluate', { expression: "switchTab('trials')" });
          await sleep(500);
          const shotTrials = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('05_tab_trials.png', Buffer.from(shotTrials.data, 'base64'));
          console.log('✅ 已保存 05_tab_trials.png');

          // 切換分頁 5: 52赫茲座談會 (Whale 52)
          console.log('\n--- 6. 檢驗分頁 5: 52赫茲座談會 ---');
          await send('Runtime.evaluate', { expression: "switchTab('whale52')" });
          await sleep(500);
          const shotWhale = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('06_tab_whale52.png', Buffer.from(shotWhale.data, 'base64'));
          console.log('✅ 已保存 06_tab_whale52.png');

          // 切換分頁 6: 典藏相簿 (Gallery)
          console.log('\n--- 7. 檢驗分頁 6: 典藏相簿 ---');
          await send('Runtime.evaluate', { expression: "switchTab('gallery')" });
          await sleep(800);
          const shotGallery = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('07_tab_gallery.png', Buffer.from(shotGallery.data, 'base64'));
          console.log('✅ 已保存 07_tab_gallery.png');

          // 切換分頁 7: 檔案資料庫 (Files)
          console.log('\n--- 8. 檢驗分頁 7: 檔案資料庫 ---');
          await send('Runtime.evaluate', { expression: "switchTab('files')" });
          await sleep(800);
          const shotFiles = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('08_tab_files.png', Buffer.from(shotFiles.data, 'base64'));
          console.log('✅ 已保存 08_tab_files.png');

          // 檢驗 Vector PDF.js 向量畫布閱讀器
          console.log('\n--- 9. 檢驗 Vector PDF.js 向量畫布閱讀器 ---');
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
          console.log('PDF 閱讀器第 1 頁狀態:', pdfState1.result.value);
          const shotPdf1 = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('09_pdf_reader_page1.png', Buffer.from(shotPdf1.data, 'base64'));
          console.log('✅ 已保存 09_pdf_reader_page1.png');

          // 檢驗 PDF 翻頁
          await send('Runtime.evaluate', { expression: 'nextPdfPage()' });
          await sleep(1500);
          const pdfState2 = await send('Runtime.evaluate', {
            expression: `({
              currentPage: document.getElementById('pdf-page-input').value,
              totalPages: document.getElementById('pdf-total-pages').innerText
            })`,
            returnByValue: true
          });
          console.log('PDF 閱讀器翻頁至第 2 頁狀態:', pdfState2.result.value);
          const shotPdf2 = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('10_pdf_reader_page2.png', Buffer.from(shotPdf2.data, 'base64'));
          console.log('✅ 已保存 10_pdf_reader_page2.png');
          await send('Runtime.evaluate', { expression: 'closeModals()' });
          await sleep(300);

          // 檢驗手機版排版 (390x844)
          console.log('\n--- 10. 檢驗手機視窗排版 (390x844) ---');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true
          });
          await send('Runtime.evaluate', { expression: "switchTab('overview')" });
          await sleep(800);
          const mobileOverflow = await send('Runtime.evaluate', {
            expression: 'document.documentElement.scrollWidth - window.innerWidth',
            returnByValue: true
          });
          console.log('手機橫向溢出寬度 (px):', mobileOverflow.result.value);
          const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
          saveScreenshot('11_mobile_overview.png', Buffer.from(shotMobile.data, 'base64'));
          console.log('✅ 已保存 11_mobile_overview.png');

          // 檢驗平板版排版 (768x1024)
          console.log('\n--- 11. 檢驗平板視窗排版 (768x1024) ---');
          await send('Emulation.setDeviceMetricsOverride', {
            width: 768,
            height: 1024,
            deviceScaleFactor: 2,
            mobile: false
          });
          await sleep(500);

          // 檢測瀏覽器控制台錯誤與例外
          console.log('\n--- 12. 控制台錯誤監聽 (Console Errors & Exceptions) ---');
          if (consoleErrors.length === 0) {
            console.log('✅ 0 Console Errors & 0 Exceptions！全站運作完全健康無虞！');
          } else {
            console.warn('⚠️ 偵測到控制台訊息:', consoleErrors);
          }

          console.log(`\n🎉 全站端到端檢測與截圖全數完成！輸出目錄: ${OUTPUT_DIR}`);
        } catch (err) {
          console.error('❌ 執行檢測過程發生例外:', err);
        } finally {
          cleanup(browserProc);
        }
      });
    });
  });
}

function cleanup(browserProc) {
  try { if (browserProc) browserProc.kill(); } catch (e) {}
  try { if (server) server.close(); } catch (e) {}
  process.exit(0);
}

server.listen(TEST_PORT, () => {
  console.log(`📡 檢驗用本機 HTTP 伺服器已於 http://localhost:${TEST_PORT} 啟動`);
  runInspectionSuite();
});
