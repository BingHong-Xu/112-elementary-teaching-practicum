/**
 * 112學年度小教教學實習成果展 - 跨平台本機啟動器
 * Cross-platform Local Exhibition Launcher (Node.js)
 * 
 * 支援 Windows, macOS, Linux。
 * 100% 雲端安全相容格式，不被 Google Drive / OneDrive 防毒安全政策封鎖。
 * 
 * 使用方式：
 * node start.js
 */

const http = require('http');
const { exec } = require('child_process');
const path = require('path');

// 載入伺服器模組
require('./server.js');

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

// 延遲 500ms 等待 HTTP 伺服器綁定後自動開啟預設瀏覽器
setTimeout(() => {
  const platform = process.platform;
  let openCommand = '';

  if (platform === 'win32') {
    openCommand = `start ${URL}`;
  } else if (platform === 'darwin') {
    openCommand = `open ${URL}`;
  } else {
    openCommand = `xdg-open ${URL}`;
  }

  console.log(`🌐 正在為您開啟預設瀏覽器瀏覽成果展: ${URL}`);
  exec(openCommand, (err) => {
    if (err) {
      console.log(`💡 請手動開啟瀏覽器並造訪: ${URL}`);
    }
  });
}, 600);
