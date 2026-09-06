const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const V2_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';
const indexFile = 'file:///' + path.join(V2_DIR, 'index.html').replace(/\\/g, '/');

const port = 9555;
const edgeProc = spawn(EDGE, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1280,950',
  indexFile
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await sleep(2000);

  http.get('http://127.0.0.1:' + port + '/json', async (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      const targets = JSON.parse(raw);
      const page = targets.find(t => t.type === 'page');
      if (!page) {
        console.error('No page target found');
        edgeProc.kill();
        process.exit(1);
      }

      const ws = new WebSocket(page.webSocketDebuggerUrl);
      let msgId = 1;
      const callbacks = {};

      ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks[msg.id]) {
          callbacks[msg.id](msg);
          delete callbacks[msg.id];
        }
      });

      function sendCmd(method, params = {}) {
        return new Promise((resolve) => {
          const id = msgId++;
          callbacks[id] = resolve;
          ws.send(JSON.stringify({ id, method, params }));
        });
      }

      async function evaluate(expression) {
        const res = await sendCmd('Runtime.evaluate', { expression, returnByValue: true });
        return res.result?.result?.value;
      }

      async function captureScreenshot(filename) {
        const res = await sendCmd('Page.captureScreenshot', { format: 'png' });
        if (res.result?.data) {
          const outPath = path.join(ARTIFACT_DIR, filename);
          fs.writeFileSync(outPath, Buffer.from(res.result.data, 'base64'));
          console.log(`📸 Screenshot saved: ${filename} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
        }
      }

      ws.addEventListener('open', async () => {
        console.log('🔗 WebSocket connected to headless Edge...');
        await sendCmd('Runtime.enable');
        await sendCmd('Page.enable');

        // Test 1: Verify data loaded
        const hasData = await evaluate('!!appData && appData.interns.length === 24');
        console.log('Test 1: App Data Loaded (24 Interns):', hasData ? '✅ PASS' : '❌ FAIL');

        // Test 2: Verify Tab 2 (Timeline)
        await evaluate('switchTab("timeline")');
        await sleep(500);
        const timelineCount = await evaluate('document.querySelectorAll("#timeline-container > div").length');
        console.log(`Test 2: Tab 2 (Timeline) Milestones rendered: ${timelineCount} (Expected 8):`, timelineCount === 8 ? '✅ PASS' : '❌ FAIL');
        await captureScreenshot('tab2_timeline.png');

        // Test 3: Verify Tab 4 (Trials)
        await evaluate('switchTab("trials")');
        await sleep(500);
        const mathCards = await evaluate('document.querySelectorAll("#trials-math-container > div").length');
        console.log(`Test 3: Tab 4 (Trials) Math cards: ${mathCards} (Expected 12):`, mathCards === 12 ? '✅ PASS' : '❌ FAIL');
        await evaluate('switchTrialCategory("mandarin")');
        await sleep(300);
        const manCards = await evaluate('document.querySelectorAll("#trials-mandarin-container > div").length');
        console.log(`Test 3b: Tab 4 (Trials) Mandarin cards: ${manCards} (Expected 12):`, manCards === 12 ? '✅ PASS' : '❌ FAIL');
        await captureScreenshot('tab4_trials.png');

        // Test 4: Verify Tab 5 (Whale 52 & Closing Ceremony)
        await evaluate('switchTab("whale52")');
        await sleep(500);
        const ceremonyPhotos = await evaluate('document.querySelectorAll("#ceremony-photos-grid > div").length');
        const hasFbPost = await evaluate('!!document.querySelector("#fb-post-showcase .glass-card")');
        console.log(`Test 4: Tab 5 (Whale 52) Ceremony Photos: ${ceremonyPhotos} (Expected 50):`, ceremonyPhotos === 50 ? '✅ PASS' : '❌ FAIL');
        console.log('Test 4b: Tab 5 Facebook Post showcase present:', hasFbPost ? '✅ PASS' : '❌ FAIL');
        await captureScreenshot('tab5_whale52.png');

        // Test 5: Verify Teacher Modal with 406 cards & documents
        await evaluate('openTeacherModal("23")'); // 李沛錞 (ID 23, Class 4-6)
        await sleep(800);
        const cardSectionHidden = await evaluate('document.getElementById("tm-406-card-section").classList.contains("hidden")');
        const cardsCount = await evaluate('document.querySelectorAll("#tm-406-cards-grid > div").length');
        const teacherDocsCount = await evaluate('document.querySelectorAll("#tm-documents-list > button").length');
        console.log('Test 5: Teacher 406 Modal Section Visible:', !cardSectionHidden ? '✅ PASS' : '❌ FAIL');
        console.log(`Test 5b: 406 Thank-you Cards in modal: ${cardsCount} (Expected 52):`, cardsCount === 52 ? '✅ PASS' : '❌ FAIL');
        console.log(`Test 5c: Teacher Documents rendered: ${teacherDocsCount} (Expected >= 5):`, teacherDocsCount >= 5 ? '✅ PASS' : '❌ FAIL');
        await captureScreenshot('teacher_modal_23_li.png');

        // Test 6: Verify Document Reader (KWLQ)
        await evaluate('closeModals()');
        await sleep(300);
        await evaluate('openDocumentReader("112.12.08-實習手札繳交/01.南雅娟-實習手札/第一週－實習手札－藝產四－410895006－南雅娟.pdf")');
        await sleep(600);
        const docTitle = await evaluate('document.getElementById("doc-title").innerText');
        const kwlqBoxes = await evaluate('document.querySelectorAll("#doc-content-body [class*=\\"kwlq-box\\"]").length');
        console.log(`Test 6: Document Reader opened: "${docTitle}":`, docTitle.length > 0 ? '✅ PASS' : '❌ FAIL');
        console.log(`Test 6b: KWLQ boxes rendered: ${kwlqBoxes} (Expected >= 4):`, kwlqBoxes >= 4 ? '✅ PASS' : '❌ FAIL');
        await captureScreenshot('doc_reader_kwlq.png');

        // Test 7: Verify PDF Modal with class practicum plan
        await evaluate('closeModals()');
        await sleep(300);
        await evaluate('handleOpenFile("4-6李沛淳、鄭凱瀚實習計畫書.pdf")');
        await sleep(600);
        const pdfIframeSrc = await evaluate('document.getElementById("pdf-iframe").src');
        const pdfModalVisible = await evaluate('!document.getElementById("pdf-modal").classList.contains("hidden")');
        console.log(`Test 7: PDF Modal visible: ${pdfModalVisible}, src: ${pdfIframeSrc}:`, (pdfModalVisible && pdfIframeSrc.includes('4-6')) ? '✅ PASS' : '❌ FAIL');
        await captureScreenshot('pdf_modal_plan406.png');

        // Test 8: Verify Audio Synthesizer Engine
        await evaluate('closeModals()');
        const audioEngineReady = await evaluate('typeof toggleDeepSeaAmbient === "function" && typeof toggle52HzAudio === "function"');
        console.log('Test 8: Web Audio Synthesizer Engine Ready:', audioEngineReady ? '✅ PASS' : '❌ FAIL');

        console.log('\n🎉 ALL 8 TESTS COMPLETED VERIFICATION!');
        edgeProc.kill();
        process.exit(0);
      });
    });
  }).on('error', (err) => {
    console.error('Connection error:', err);
    edgeProc.kill();
    process.exit(1);
  });
}

run();
