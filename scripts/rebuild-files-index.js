const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const MEDIA_ROOT = 'G:\\我的雲端硬碟\\112上-小教教學實習-20260830T083306Z-1-001\\112上-小教教學實習';

const docsText = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data/documents-text.js'), 'utf8').replace('window.DOCUMENTS_TEXT = ', '').replace(/;\s*$/, ''));
const docKeys = Object.keys(docsText);

const rawData = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data/practicum-data.json'), 'utf8'));
const interns = rawData.interns || [];
const classes = rawData.classes || [];

const teacherNames = interns.map(i => i.name).concat(['李沛淳']);

function detectTeacher(text) {
  for (const t of teacherNames) {
    if (text.includes(t)) {
      return t === '李沛淳' ? '李沛錞' : t;
    }
  }
  return '';
}

function detectClass(text, teacher) {
  if (teacher) {
    const found = interns.find(i => i.name === teacher || (teacher === '李沛錞' && i.name === '李沛錞'));
    if (found && found.classId) return found.classId;
  }
  const match = text.match(/([2456]-[0-9]+)/);
  if (match) return match[1];
  return '';
}

function detectGrade(classId, text) {
  if (classId) {
    if (classId.startsWith('2-')) return '低年級';
    if (classId.startsWith('4-')) return '中年級';
    if (classId.startsWith('5-') || classId.startsWith('6-')) return '高年級';
  }
  if (text.includes('低年級') || text.includes('二上') || text.includes('二下')) return '低年級';
  if (text.includes('中年級') || text.includes('四上') || text.includes('四下')) return '中年級';
  if (text.includes('高年級') || text.includes('五上') || text.includes('六上')) return '高年級';
  return '全校性';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function cleanDisplayTitle(filename, teacher, cat) {
  let name = filename.replace(/\.pdf$/i, '').replace(/\.mp4$/i, '');
  // Remove duplicate numeric prefixes like 01. 1- etc
  name = name.replace(/^[0-9]+[-_.]\s*/, '');
  if (teacher && !name.includes(teacher)) {
    return `${teacher} 老師 ‧ ${name}`;
  }
  return name;
}

const fileList = [];

// 1. Read existing files-index
const oldIndex = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'data/files-index.js'), 'utf8').replace('window.FILES_INDEX = ', '').replace(/;\s*$/, ''));

oldIndex.forEach(f => {
  // Exclude loose photos from the document archive (they are in Photo Gallery)
  if (f.ext === '.jpg' || f.ext === '.jpeg' || f.ext === '.png' || f.ext === '.webp') return;

  const r = (f.relPath || '') + ' ' + (f.name || '');
  let catKey = 'manual';
  let catName = '實習手冊與評量指引';
  let catIcon = 'clipboard-list';

  if (f.ext === '.mp4') {
    catKey = 'video';
    catName = '實習影音多媒體實錄';
    catIcon = 'video';
  } else if (r.includes('實習計畫') || r.includes('計畫書')) {
    catKey = 'plan';
    catName = '實習班級計畫書';
    catIcon = 'book';
  } else if (r.includes('教案')) {
    catKey = 'lesson';
    catName = '課堂公開試教教案';
    catIcon = 'pen-tool';
  } else if (r.includes('手札') || r.includes('週誌') || r.includes('KWLQ')) {
    catKey = 'journal';
    catName = '實習手札週誌 (KWLQ)';
    catIcon = 'edit-3';
  } else if (r.includes('心得') || r.includes('實習報告')) {
    catKey = 'report';
    catName = '期末實習心得報告';
    catIcon = 'graduation-cap';
  } else if (r.includes('紀念冊') || r.includes('卡片') || r.includes('感恩卡') || r.includes('相簿')) {
    catKey = 'album';
    catName = '特輯紀念冊與相簿';
    catIcon = 'image';
  }

  const teacher = detectTeacher(r);
  const classId = detectClass(r, teacher);
  const grade = detectGrade(classId, r);

  // Match in documentsText
  let matchedDocKey = null;
  for (const k of docKeys) {
    if (k.includes(f.name) || (f.name.length > 8 && k.includes(f.name.substring(0, 8)))) {
      matchedDocKey = k;
      break;
    }
  }

  // Check if file exists locally in assets/pdfs
  const localPdfPath = path.join(PROJECT_ROOT, 'assets/pdfs', f.name);
  const isLocalAsset = fs.existsSync(localPdfPath);

  fileList.push({
    id: f.relPath,
    name: f.name,
    title: cleanDisplayTitle(f.name, teacher, catKey),
    relPath: isLocalAsset ? ('assets/pdfs/' + f.name) : f.relPath,
    ext: f.ext,
    size: f.size,
    sizeFormatted: formatBytes(f.size),
    categoryKey: catKey,
    categoryName: catName,
    categoryIcon: catIcon,
    author: teacher || (classId ? `${classId} 實習組` : '實習輔導組'),
    grade,
    classId,
    hasText: !!matchedDocKey,
    docKey: matchedDocKey,
    isLocalAsset,
    originalDocPath: f.originalDocPath || null,
    originalDocName: f.originalDocName || null,
    originalDocExt: f.originalDocExt || null
  });
});

// 2. Add local Special Album PDFs in assets/pdfs
const specialAlbums = [
  { name: '四年六班全體學生手繪感恩卡全集數位典藏冊-全52頁.pdf', title: '四年六班全體學生手繪感恩卡全集數位典藏冊 (全52頁)', author: '李沛錞、鄭凱瀚', classId: '4-6', grade: '中年級', size: 16759502 },
  { name: '四維國小三週實習休業式『夢想共聲 ５２赫茲』官方活動紀實全紀念冊-全33頁.pdf', title: '四維國小三週實習休業式『夢想共聲 ５２赫茲』官方活動紀實全紀念冊 (全33頁)', author: '徐秉鴻、全體實習生', classId: '', grade: '全校性', size: 6683327 },
  { name: '11.20實習始業式數位光影相簿-全36頁.pdf', title: '11.20 實習始業式數位光影相簿 (全36頁)', author: '實習總召組', classId: '', grade: '全校性', size: 6224947 },
  { name: '12.08實習休業式數位光影相簿-全50頁.pdf', title: '12.08 實習休業式數位光影相簿 (全50頁)', author: '實習總召組', classId: '', grade: '全校性', size: 7659157 },
  { name: '班級實習花絮數位光影相簿-全54頁.pdf', title: '班級實習花絮數位光影相簿 (全54頁)', author: '各班實習教師', classId: '', grade: '全校性', size: 9102763 },
  { name: '師生合影與下課紀念數位光影相簿-全26頁.pdf', title: '師生合影與下課紀念數位光影相簿 (全26頁)', author: '全體實習教師', classId: '', grade: '全校性', size: 4931733 }
];

specialAlbums.forEach(a => {
  if (!fileList.some(f => f.name === a.name)) {
    fileList.push({
      id: 'assets/pdfs/' + a.name,
      name: a.name,
      title: a.title,
      relPath: 'assets/pdfs/' + a.name,
      ext: '.pdf',
      size: a.size,
      sizeFormatted: formatBytes(a.size),
      categoryKey: 'album',
      categoryName: '特輯紀念冊與相簿',
      categoryIcon: 'image',
      author: a.author,
      grade: a.grade,
      classId: a.classId,
      hasText: false,
      docKey: null,
      isLocalAsset: true,
      originalDocPath: null
    });
  }
});

// 3. Add 24 teacher photo album PDFs in assets/pdfs/teachers
const teacherAlbumFiles = fs.readdirSync(path.join(PROJECT_ROOT, 'assets/pdfs/teachers')).filter(f => f.endsWith('.pdf'));
teacherAlbumFiles.forEach(f => {
  const stat = fs.statSync(path.join(PROJECT_ROOT, 'assets/pdfs/teachers', f));
  const tName = f.replace(/^[0-9]+_/, '').replace(/-光影相簿\.pdf$/, '');
  const found = interns.find(i => i.name === tName);
  const classId = found ? found.classId : '';
  const grade = detectGrade(classId, tName);

  if (!fileList.some(item => item.name === f)) {
    fileList.push({
      id: 'assets/pdfs/teachers/' + f,
      name: f,
      title: `${tName} 老師 ‧ 個人專屬數位光影相簿 (PDF)`,
      relPath: 'assets/pdfs/teachers/' + f,
      ext: '.pdf',
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      categoryKey: 'album',
      categoryName: '特輯紀念冊與相簿',
      categoryIcon: 'image',
      author: tName,
      grade,
      classId,
      hasText: false,
      docKey: null,
      isLocalAsset: true,
      originalDocPath: null
    });
  }
});

// Sort by category order then name
const catOrder = {
  'plan': 1,
  'lesson': 2,
  'journal': 3,
  'report': 4,
  'album': 5,
  'manual': 6,
  'video': 7
};

fileList.sort((a, b) => {
  const oA = catOrder[a.categoryKey] || 99;
  const oB = catOrder[b.categoryKey] || 99;
  if (oA !== oB) return oA - oB;
  return a.name.localeCompare(b.name, 'zh-Hant');
});

const outContent = 'window.FILES_INDEX = ' + JSON.stringify(fileList, null, 2) + ';\n';
fs.writeFileSync(path.join(PROJECT_ROOT, 'data/files-index.js'), outContent, 'utf8');

console.log(`Successfully generated data/files-index.js with ${fileList.length} categorized items.`);

const catCounts = {};
fileList.forEach(f => {
  catCounts[f.categoryName] = (catCounts[f.categoryName] || 0) + 1;
});
console.log('Category breakdown:', catCounts);
