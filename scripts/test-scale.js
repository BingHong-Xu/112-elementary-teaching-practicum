const { execFileSync } = require('child_process');
const fs = require('fs');

const ffmpeg = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const vf = "scale='if(gt(a,1),min(1280,iw),-2)':'if(gt(a,1),-2,min(1280,ih))'";

const srcPortrait = 'G:\\我的雲端硬碟\\112上-小教教學實習-20260830T083306Z-1-001\\112上-小教教學實習\\112.11.20-12.08三週實習\\2實習照片、影片\\2各班實習花絮\\2-中年級\\4-6 鄭凱瀚、李沛錞\\406全體同學給沛錞老師的卡片\\四年六班學生手繪給沛錞老師感恩卡46.jpg';
const srcLandscape = 'G:\\我的雲端硬碟\\112上-小教教學實習-20260830T083306Z-1-001\\112上-小教教學實習\\112.11.20-12.08三週實習\\2實習照片、影片\\1實習始業式-11.20\\2.入班、介紹實習老師\\1-低年級\\2-8 陳嬿亘、曾麗萍\\二年八班入班介紹實習老師.jpg';

execFileSync(ffmpeg, ['-y', '-i', srcPortrait, '-vf', vf, '-c:v', 'libwebp', '-quality', '82', 'test_p.webp'], { stdio: 'inherit' });
execFileSync(ffmpeg, ['-y', '-i', srcLandscape, '-vf', vf, '-c:v', 'libwebp', '-quality', '82', 'test_l.webp'], { stdio: 'inherit' });

console.log('Portrait size:', (fs.statSync('test_p.webp').size / 1024).toFixed(1), 'KB');
console.log('Landscape size:', (fs.statSync('test_l.webp').size / 1024).toFixed(1), 'KB');
