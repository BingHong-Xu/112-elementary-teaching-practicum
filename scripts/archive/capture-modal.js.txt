const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const V2_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';
const indexFile = 'file:///' + path.join(V2_DIR, 'index.html').replace(/\\/g, '/');
const modalShot = path.join(ARTIFACT_DIR, 'v2_teacher_modal_406.png');

const port = 9444;
const edgeProc = spawn(EDGE, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,950',
  indexFile
]);

setTimeout(() => {
  http.get('http://127.0.0.1:' + port + '/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      const targets = JSON.parse(raw);
      const page = targets.find(t => t.type === 'page');
      if (!page) { edgeProc.kill(); return; }

      const ws = new WebSocket(page.webSocketDebuggerUrl);
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: { expression: 'openTeacherModal("23");' }
        }));
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 4,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 1500);
      });

      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 4 && msg.result?.data) {
          fs.writeFileSync(modalShot, Buffer.from(msg.result.data, 'base64'));
          console.log('Saved modal shot:', modalShot);
          edgeProc.kill();
          process.exit(0);
        }
      });
    });
  }).on('error', e => {
    console.error('HTTP err:', e);
    edgeProc.kill();
  });
}, 2000);
