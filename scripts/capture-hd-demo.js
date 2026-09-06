const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const V2_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';
const indexFile = 'file:///' + path.join(V2_DIR, 'index.html').replace(/\\/g, '/');

const port = 9445;
const edgeProc = spawn(EDGE, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,950',
  indexFile
]);

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await wait(2500);

  http.get(`http://127.0.0.1:${port}/json`, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      const targets = JSON.parse(raw);
      const page = targets.find(t => t.type === 'page');
      if (!page) {
        console.error('No page target found');
        edgeProc.kill();
        return;
      }

      const ws = new WebSocket(page.webSocketDebuggerUrl);

      let msgId = 1;
      const callbacks = new Map();

      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (callbacks.has(msg.id)) {
          const cb = callbacks.get(msg.id);
          callbacks.delete(msg.id);
          cb(msg.result);
        }
      });

      function sendCmd(method, params = {}) {
        return new Promise((resolve) => {
          const id = msgId++;
          callbacks.set(id, resolve);
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      ws.addEventListener('open', async () => {
        await sendCmd('Runtime.enable');
        await sendCmd('Page.enable');

        // 1. Teacher Modal with 406 cards
        console.log('Opening teacher modal 23...');
        await sendCmd('Runtime.evaluate', { expression: 'openTeacherModal("23");' });
        await wait(1500);
        let shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'teacher_modal_23_li.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved teacher_modal_23_li.png');

        // 2. Lightbox with 406 Thank You Card
        console.log('Opening 406 card in lightbox...');
        await sendCmd('Runtime.evaluate', { expression: 'openPhotoLightbox("cards406", 0);' });
        await wait(1500);
        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'lightbox_card406_hd.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved lightbox_card406_hd.png');

        // 3. Lightbox with Classroom photo
        console.log('Opening classroom photo in lightbox...');
        await sendCmd('Runtime.evaluate', { expression: 'openPhotoLightbox("classroom", 0);' });
        await wait(1500);
        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'lightbox_classroom_hd.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved lightbox_classroom_hd.png');

        // 4. Tab 5: Whale 52 Ceremony
        console.log('Switching to whale52 tab...');
        await sendCmd('Runtime.evaluate', { expression: 'closeModals(); switchTab("whale52");' });
        await wait(1500);
        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'tab5_whale52.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved tab5_whale52.png');

        console.log('All HD captures finished successfully!');
        edgeProc.kill();
        process.exit(0);
      });
    });
  }).on('error', (err) => {
    console.error('HTTP err:', err);
    edgeProc.kill();
  });
}

run();
