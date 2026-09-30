const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const V2_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';

const indexFile = 'file:///' + path.join(V2_DIR, 'index.html').replace(/\\/g, '/');

// 1. Classes Tab
const classesShot = path.join(ARTIFACT_DIR, 'v2_classes_tab.png');
spawnSync(EDGE, [
  '--headless=new',
  '--hide-scrollbars',
  '--virtual-time-budget=3000',
  '--window-size=1280,950',
  '--screenshot=' + classesShot,
  indexFile + '#classes'
], { stdio: 'pipe' });

if (fs.existsSync(classesShot)) {
  console.log(`📸 Classes Tab: v2_classes_tab.png (${(fs.statSync(classesShot).size / 1024).toFixed(1)} KB)`);
}

// 2. Gallery Tab
const galleryShot = path.join(ARTIFACT_DIR, 'v2_gallery_tab.png');
spawnSync(EDGE, [
  '--headless=new',
  '--hide-scrollbars',
  '--virtual-time-budget=3000',
  '--window-size=1280,950',
  '--screenshot=' + galleryShot,
  indexFile + '#gallery'
], { stdio: 'pipe' });

if (fs.existsSync(galleryShot)) {
  console.log(`📸 Gallery Tab: v2_gallery_tab.png (${(fs.statSync(galleryShot).size / 1024).toFixed(1)} KB)`);
}

// 3. Trials Tab
const trialsShot = path.join(ARTIFACT_DIR, 'v2_trials_tab.png');
spawnSync(EDGE, [
  '--headless=new',
  '--hide-scrollbars',
  '--virtual-time-budget=3000',
  '--window-size=1280,950',
  '--screenshot=' + trialsShot,
  indexFile + '#trials'
], { stdio: 'pipe' });

if (fs.existsSync(trialsShot)) {
  console.log(`📸 Trials Tab: v2_trials_tab.png (${(fs.statSync(trialsShot).size / 1024).toFixed(1)} KB)`);
}

console.log('✅ Tabs capture finished!');
