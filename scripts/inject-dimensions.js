const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';

function getWebPDimensions(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
    const format = buf.toString('ascii', 12, 16);
    if (format === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    } else if (format === 'VP8L') {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
      return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
    } else if (format === 'VP8X') {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
  } catch (e) {
    return null;
  }
  return null;
}

// 1. Update practicum-data.json & practicum-data.js
console.log('Updating practicum-data...');
const pData = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data/practicum-data.json'), 'utf8'));

for (const albKey in pData.photoAlbums) {
  const alb = pData.photoAlbums[albKey];
  if (alb && Array.isArray(alb.photos)) {
    alb.photos.forEach(p => {
      if (p.thumbUrl) {
        const dim = getWebPDimensions(path.join(PROJECT_ROOT, p.thumbUrl));
        if (dim) {
          p.width = dim.width;
          p.height = dim.height;
          p.ratio = parseFloat((dim.width / dim.height).toFixed(2));
          p.orientation = dim.width >= dim.height ? 'landscape' : 'portrait';
          p.dimensionStr = `${dim.width} × ${dim.height}`;
          p.sizeLabel = dim.width >= dim.height ? '橫向寬幅' : '直向立幅';
        }
      }
    });
  }
}

fs.writeFileSync(path.join(PROJECT_ROOT, 'data/practicum-data.json'), JSON.stringify(pData, null, 2), 'utf8');
fs.writeFileSync(path.join(PROJECT_ROOT, 'data/practicum-data.js'), 'window.PRACTICUM_DATA = ' + JSON.stringify(pData) + ';\n', 'utf8');
console.log('Updated practicum-data.json and practicum-data.js with exact dimensions.');

// 2. Update teacher-media-map.js
console.log('Updating teacher-media-map...');
const tContent = fs.readFileSync(path.join(PROJECT_ROOT, 'data/teacher-media-map.js'), 'utf8');
const tMap = JSON.parse(tContent.replace('window.TEACHER_MEDIA_MAP = ', '').replace(/;\s*$/, ''));

for (const tId in tMap) {
  if (Array.isArray(tMap[tId].photos)) {
    tMap[tId].photos.forEach(p => {
      if (p.thumbUrl) {
        const dim = getWebPDimensions(path.join(PROJECT_ROOT, p.thumbUrl));
        if (dim) {
          p.width = dim.width;
          p.height = dim.height;
          p.ratio = parseFloat((dim.width / dim.height).toFixed(2));
          p.orientation = dim.width >= dim.height ? 'landscape' : 'portrait';
          p.dimensionStr = `${dim.width} × ${dim.height}`;
          p.sizeLabel = dim.width >= dim.height ? '橫向寬幅' : '直向立幅';
        }
      }
    });
  }
}

fs.writeFileSync(path.join(PROJECT_ROOT, 'data/teacher-media-map.js'), 'window.TEACHER_MEDIA_MAP = ' + JSON.stringify(tMap) + ';\n', 'utf8');
console.log('Updated teacher-media-map.js with exact dimensions.');

// 3. Rebuild comprehensive files-index.js with both documents AND photos categorized by type and dimensions
console.log('Rebuilding files-index.js with full type and dimension classifications...');
const oldIndex = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data/files-index.js'), 'utf8').replace('window.FILES_INDEX = ', '').replace(/;\s*$/, ''));

// Update dimensions for document items
oldIndex.forEach(f => {
  if (f.ext === '.pdf') {
    f.orientation = 'document';
    f.dimensionStr = 'A4 規格 (210 × 297 mm)';
    f.sizeLabel = '標準公文規格';
  } else if (f.ext === '.mp4') {
    f.orientation = 'video';
    f.dimensionStr = '720p HD (1280 × 720)';
    f.sizeLabel = '高畫質影音';
  }
});

// Also add photo entries to files-index, cleanly classified by orientation
const photoEntries = [];
const seenPhotos = new Set();

for (const albKey in pData.photoAlbums) {
  const alb = pData.photoAlbums[albKey];
  if (alb && Array.isArray(alb.photos)) {
    alb.photos.forEach(p => {
      if (!seenPhotos.has(p.relPath)) {
        seenPhotos.add(p.relPath);

        const isLandscape = p.orientation === 'landscape';
        const catKey = isLandscape ? 'photo_landscape' : 'photo_portrait';
        const catName = isLandscape ? '橫向寬幅寫真 (1280×960)' : '直向立幅寫真與卡片 (960×1280)';
        const catIcon = isLandscape ? 'image' : 'smartphone';

        photoEntries.push({
          id: p.relPath,
          name: p.name || path.basename(p.relPath),
          title: p.caption || p.name || '實習光影真跡',
          relPath: p.relPath,
          thumbUrl: p.thumbUrl,
          ext: p.ext || '.jpg',
          size: p.size || 0,
          sizeFormatted: p.size ? (p.size > 1024*1024 ? (p.size/1024/1024).toFixed(1) + ' MB' : Math.round(p.size/1024) + ' KB') : '',
          categoryKey: catKey,
          categoryName: catName,
          categoryIcon: catIcon,
          author: alb.title || '實習光影',
          grade: p.name && p.name.includes('低年級') ? '低年級' : (p.name && p.name.includes('中年級') ? '中年級' : (p.name && p.name.includes('高年級') ? '高年級' : '全校性')),
          classId: '',
          hasText: false,
          isLocalAsset: false,
          isPhoto: true,
          width: p.width || 1280,
          height: p.height || 960,
          orientation: p.orientation || 'landscape',
          dimensionStr: p.dimensionStr || (isLandscape ? '1280 × 960 (4:3)' : '960 × 1280 (3:4)'),
          sizeLabel: isLandscape ? '橫向寬幅' : '直向立幅'
        });
      }
    });
  }
}

const allCombined = oldIndex.concat(photoEntries);

const catOrder = {
  'plan': 1,
  'lesson': 2,
  'journal': 3,
  'report': 4,
  'album': 5,
  'manual': 6,
  'photo_landscape': 7,
  'photo_portrait': 8,
  'video': 9
};

allCombined.sort((a, b) => {
  const oA = catOrder[a.categoryKey] || 99;
  const oB = catOrder[b.categoryKey] || 99;
  if (oA !== oB) return oA - oB;
  return (a.title || a.name).localeCompare((b.title || b.name), 'zh-Hant');
});

fs.writeFileSync(path.join(PROJECT_ROOT, 'data/files-index.js'), 'window.FILES_INDEX = ' + JSON.stringify(allCombined) + ';\n', 'utf8');

console.log(`Total files in enriched index: ${allCombined.length} (${oldIndex.length} docs + ${photoEntries.length} photos)`);
const stats = {};
allCombined.forEach(f => {
  stats[f.categoryName] = (stats[f.categoryName] || 0) + 1;
});
console.log('Category breakdown:', stats);
