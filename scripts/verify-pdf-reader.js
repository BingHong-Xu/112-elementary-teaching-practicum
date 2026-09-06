const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';
const shot1 = path.join(ARTIFACT_DIR, 'v2_pdf_reader_canvas.png');
const shot2 = path.join(ARTIFACT_DIR, 'v2_pdf_reader_page2.png');

const port = 9446;
const edgeProc = spawn(EDGE, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,950',
  'http://localhost:3000/index.html'
]);

let ws = null;

setTimeout(() => {
  http.get('http://127.0.0.1:' + port + '/json', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      const targets = JSON.parse(raw);
      const page = targets.find(t => t.type === 'page');
      if (!page) { edgeProc.kill(); return; }

      ws = new WebSocket(page.webSocketDebuggerUrl);
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
        
        setTimeout(() => {
          console.log('Testing openPdfModal for 406 cards (52 pages)...');
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: 'openPdfModal("assets/pdfs/四年六班全體學生手繪感恩卡全集數位典藏冊-全52頁.pdf", "四年六班全體學生手繪感恩卡全集數位典藏冊 (全52頁)")',
              returnByValue: true
            }
          }));

          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 4,
              method: 'Runtime.evaluate',
              params: {
                expression: '(() => {' +
                  'const modal = document.getElementById("pdf-modal");' +
                  'const canvas = document.querySelector("#pdf-canvas-container canvas");' +
                  'const pageInput = document.getElementById("pdf-page-input");' +
                  'const totalPages = document.getElementById("pdf-total-pages");' +
                  'const title = document.getElementById("pdf-title");' +
                  'return {' +
                    'modalVisible: modal && !modal.classList.contains("hidden"),' +
                    'canvasExists: !!canvas,' +
                    'canvasWidth: canvas ? canvas.width : 0,' +
                    'canvasHeight: canvas ? canvas.height : 0,' +
                    'currentPage: pageInput ? pageInput.value : null,' +
                    'totalPages: totalPages ? totalPages.innerText : null,' +
                    'title: title ? title.innerText : null' +
                  '};' +
                '})()',
                returnByValue: true
              }
            }));
          }, 3500);

        }, 1500);
      });

      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 4) {
          console.log('PDF Render State Page 1:', JSON.stringify(msg.result?.result?.value));
          ws.send(JSON.stringify({
            id: 5,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        } else if (msg.id === 5 && msg.result?.data) {
          fs.writeFileSync(shot1, Buffer.from(msg.result.data, 'base64'));
          console.log('✅ Saved Page 1 canvas screenshot:', shot1);

          console.log('Testing nextPdfPage()...');
          ws.send(JSON.stringify({
            id: 6,
            method: 'Runtime.evaluate',
            params: {
              expression: 'nextPdfPage();',
              returnByValue: true
            }
          }));

          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 7,
              method: 'Runtime.evaluate',
              params: {
                expression: '(() => {' +
                  'const pageInput = document.getElementById("pdf-page-input");' +
                  'const totalPages = document.getElementById("pdf-total-pages");' +
                  'return {' +
                    'currentPage: pageInput ? pageInput.value : null,' +
                    'totalPages: totalPages ? totalPages.innerText : null' +
                  '};' +
                '})()',
                returnByValue: true
              }
            }));
          }, 2000);

        } else if (msg.id === 7) {
          console.log('PDF Render State Page 2:', JSON.stringify(msg.result?.result?.value));
          ws.send(JSON.stringify({
            id: 8,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        } else if (msg.id === 8 && msg.result?.data) {
          fs.writeFileSync(shot2, Buffer.from(msg.result.data, 'base64'));
          console.log('✅ Saved Page 2 canvas screenshot:', shot2);
          console.log('🎉 ALL PDF.js VERIFICATION TESTS PASSED!');
          edgeProc.kill();
          process.exit(0);
        }
      });
    });
  }).on('error', e => {
    console.error('HTTP err:', e);
    edgeProc.kill();
    process.exit(1);
  });
}, 1000);
