const { execSync } = require('child_process');
const fs = require('fs');
const ffmpeg = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const src = 'G:\\我的雲端硬碟\\112上-小教教學實習-20260830T083306Z-1-001\\112上-小教教學實習\\112.11.20-12.08三週實習\\2實習照片、影片\\2各班實習花絮\\2-中年級\\4-6 鄭凱瀚、李沛錞\\406全體同學給沛錞老師的卡片\\四年六班學生手繪給沛錞老師感恩卡46.jpg';

execSync(`"${ffmpeg}" -y -i "${src}" -vf "scale=800:-2" -c:v libwebp -quality 80 test_800.webp`);
execSync(`"${ffmpeg}" -y -i "${src}" -vf "scale=1200:-2" -c:v libwebp -quality 82 test_1200.webp`);
execSync(`"${ffmpeg}" -y -i "${src}" -vf "scale=1600:-2" -c:v libwebp -quality 82 test_1600.webp`);

console.log('800px size:', (fs.statSync('test_800.webp').size / 1024).toFixed(1), 'KB');
console.log('1200px size:', (fs.statSync('test_1200.webp').size / 1024).toFixed(1), 'KB');
console.log('1600px size:', (fs.statSync('test_1600.webp').size / 1024).toFixed(1), 'KB');
