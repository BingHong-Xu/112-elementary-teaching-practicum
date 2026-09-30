const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const V2_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';
const indexFile = 'file:///' + path.join(V2_DIR, 'index.html').replace(/\\/g, '/');

const port = 9446;
const edgeProc = spawn(EDGE, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1380,1050',
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

        // 1. Tab 6: Photo Gallery with Dimension Grouped Sections
        console.log('Navigating to Tab 6 (gallery)...');
        await sendCmd('Runtime.evaluate', { expression: 'switchTab("gallery");' });
        await wait(2000);

        let shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_gallery_dimension_grouped.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved v2_gallery_dimension_grouped.png');

        // 2. Filter Tab 6 to Portrait only (960x1280 cards)
        console.log('Filtering gallery to portrait orientation...');
        await sendCmd('Runtime.evaluate', { expression: 'filterGalleryOrientation("portrait");' });
        await wait(1500);

        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_gallery_portrait_cards.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved v2_gallery_portrait_cards.png');

        // Reset gallery
        await sendCmd('Runtime.evaluate', { expression: 'filterGalleryOrientation("all");' });

        // 3. Tab 7: Digital Files Archive with 9 Categories & Dimension Controls
        console.log('Switching to Tab 7 (files)...');
        await sendCmd('Runtime.evaluate', { expression: 'switchTab("files"); filterFilesDimension("all"); filterFilesCategory("all");' });
        await wait(2000);

        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_files_tab_dimensions.png'), Buffer.from(shot.data, 'base64'));
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_files_tab_grouped.png'), Buffer.from(shot.data, 'base64'));
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_files_tab.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved v2_files_tab_dimensions.png');

        // 4. Filter Tab 7 by Portrait Dimension (960x1280)
        console.log('Filtering Tab 7 by portrait dimension...');
        await sendCmd('Runtime.evaluate', { expression: 'filterFilesDimension("portrait");' });
        await wait(1500);

        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_files_tab_portrait_filter.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved v2_files_tab_portrait_filter.png');

        // 5. Switch to Table view with Dimension Column
        console.log('Switching to table view for plans...');
        await sendCmd('Runtime.evaluate', { expression: 'filterFilesDimension("all"); filterFilesCategory("plan"); switchFileViewMode("table");' });
        await wait(1500);

        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_files_tab_table_dimensions.png'), Buffer.from(shot.data, 'base64'));
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_files_tab_table.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved v2_files_tab_table_dimensions.png');

        // 6. Test Lightbox Header Dimension Badge
        console.log('Opening photo lightbox to verify dimension badge...');
        await sendCmd('Runtime.evaluate', { expression: 'switchTab("gallery"); filterGalleryOrientation("portrait"); openGalleryGroupLightbox("portrait", 0);' });
        await wait(1500);

        shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'v2_lightbox_dimension_badge.png'), Buffer.from(shot.data, 'base64'));
        console.log('Saved v2_lightbox_dimension_badge.png');

        console.log('🎉 All Dimension Verification Screenshots captured successfully!');
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
