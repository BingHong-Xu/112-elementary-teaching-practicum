/**
 * 112 Teaching Practicum Hub - Modern Frontend Logic v2
 * High-performance, crash-free, zero-memory-leak architecture
 */

let appData = null;
let documentsText = {};
let teacherMedia = {};
let allFiles = [];

let currentAlbum = 'all';
let currentAlbumPhotos = [];
let currentPhotoIndex = 0;
let currentGradeFilter = 'all';
let currentTrialSubject = 'math';
let currentFileFilter = 'all';
let currentFileGradeFilter = 'all';
let currentFileDimensionFilter = 'all'; // 'all', 'document', 'landscape', 'portrait', 'video'
let currentFileViewMode = 'card'; // 'card' or 'table'
let currentGalleryOrientation = 'all'; // 'all', 'landscape', 'portrait'
let currentGalleryGroupMode = true; // true = dimension-grouped sections, false = continuous grid
let galleryDisplayLimitLandscape = 60;
let galleryDisplayLimitPortrait = 80;
let filesCategoryPageLimit = 36;

function bootApp() {
  appData = window.PRACTICUM_DATA || null;
  documentsText = window.DOCUMENTS_TEXT || {};
  teacherMedia = window.TEACHER_MEDIA_MAP || {};
  allFiles = window.FILES_INDEX || [];

  if (!appData) {
    fetch('data/practicum-data.json')
      .then(r => r.json())
      .then(d => {
        appData = d;
        initApp();
      })
      .catch(e => console.error('Data load error:', e));
  } else {
    initApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

function initApp() {
  renderOverview();
  renderTimeline();
  renderClasses();
  renderTeachers();
  renderTrials();
  renderWhale52();
  renderGallery();
  renderFilesArchive();

  setupGlobalEvents();
  if (window.lucide) lucide.createIcons();

  // Support direct hash navigation
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('tab-' + hash)) {
    switchTab(hash);
  }
}

// --- Navigation Tabs ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
      btn.classList.remove('text-slate-300');
    } else {
      btn.classList.remove('active');
      btn.classList.add('text-slate-300');
    }
  });

  document.querySelectorAll('[data-mob-tab]').forEach(btn => {
    if (btn.dataset.mobTab === tabId) {
      btn.classList.add('text-cyan-400');
      btn.classList.remove('text-slate-400');
    } else {
      btn.classList.remove('text-cyan-400');
      btn.classList.add('text-slate-400');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) lucide.createIcons();
}

// --- Tab 1: Overview ---
function renderOverview() {
  const container = document.getElementById('tab-overview');
  if (!container || !appData) return;

  const sups = appData.supervisors || [
    { title: '實習指導教授', name: '呂瑞芬 校長', org: '高師大師培中心', role: '督導教育實習進程、主持開閉幕式座談與專題指導' },
    { title: '特邀指導教授', name: '方金雅 教授', org: '高師大師培中心', role: '教學演示總評審、國語與數學試教全方位提問與講評' }
  ];

  const supBox = document.getElementById('overview-supervisors');
  if (supBox) {
    supBox.innerHTML = sups.map(s => `
      <div class="glass-card rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 border border-sky-500/20">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0">
          ${s.name.charAt(0)}
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">${s.title}</span>
            <span class="text-xs text-slate-400">${s.org}</span>
          </div>
          <div class="text-base sm:text-lg font-bold text-white tracking-tight">${s.name}</div>
          <p class="text-xs text-slate-300 leading-relaxed">${s.role}</p>
        </div>
      </div>
    `).join('');
  }
}

// --- Tab 2: Timeline ---
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container || !appData) return;

  const milestones = appData.timeline || appData.milestones || [];
  if (milestones.length === 0) return;

  container.innerHTML = milestones.map(m => `
    <div class="relative pl-8 sm:pl-10 pb-8 border-l-2 border-sky-500/30 last:border-l-0 last:pb-0">
      <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-400 border-4 border-slate-900 shadow-md"></div>
      <div class="glass-card rounded-2xl p-4 sm:p-5 space-y-2">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-600/40">${m.date}</span>
          <span class="text-xs text-slate-400 font-medium">${m.tag || m.phase || '實習紀事'}</span>
        </div>
        <h3 class="text-sm sm:text-base font-bold text-white">${m.title}</h3>
        <p class="text-xs text-slate-300 leading-relaxed">${m.desc || ''}</p>
      </div>
    </div>
  `).join('');
}

// --- Tab 3: Classes & Intern Teachers ---
function renderClasses() {
  const grid = document.getElementById('classes-grid');
  if (!grid || !appData || !appData.classes) return;

  const filtered = currentGradeFilter === 'all' 
    ? appData.classes 
    : appData.classes.filter(c => {
        if (currentGradeFilter === '低年級') return c.id.startsWith('2-');
        if (currentGradeFilter === '中年級') return c.id.startsWith('4-');
        if (currentGradeFilter === '高年級') return c.id.startsWith('5-') || c.id.startsWith('6-');
        return true;
      });

  grid.innerHTML = filtered.map(c => {
    const is406 = c.id === '4-6';
    const teacherList = [
      c.mathTeacher ? `${c.mathTeacher} (數學)` : '',
      c.mandarinTeacher ? `${c.mandarinTeacher} (國語)` : ''
    ].filter(Boolean).join('、');

    return `
      <div class="glass-card rounded-2xl p-4 sm:p-5 space-y-3 relative ${is406 ? 'border-pink-500/50 shadow-lg shadow-pink-950/20' : ''}">
        <div class="flex items-center justify-between">
          <span class="text-base font-bold text-white">${c.className}</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            ${c.id.startsWith('2-') ? '低年級' : (c.id.startsWith('4-') ? '中年級' : '高年級')}
          </span>
        </div>
        <div class="text-xs text-slate-300">
          輔導導師：<strong class="text-white font-bold">${c.mentor} 老師</strong>
        </div>
        <div class="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
          <div>實習教師：<span class="text-sky-300 font-medium">${teacherList}</span></div>
          ${c.planFileObj ? `
            <div class="pt-1">
              <button onclick="handleOpenFile('${c.planFileObj.relPath}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium flex items-center space-x-1 transition">
                <i data-lucide="file-text" class="w-3 h-3"></i>
                <span>翻閱實習計畫書</span>
              </button>
            </div>
          ` : ''}
          ${is406 ? `
            <div class="p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-[11px] text-pink-200 flex items-center justify-between gap-2 mt-2">
              <span>💌 收錄 406 班全體 52 份學童手繪感恩卡</span>
              <button onclick="openTeacherModal('23')" class="px-2 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold whitespace-nowrap transition">
                查看卡冊
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function filterClassesGrade(grade) {
  currentGradeFilter = grade;
  document.querySelectorAll('[data-grade-btn]').forEach(b => {
    if (b.dataset.gradeBtn === grade) {
      b.className = 'px-3 py-1 rounded-lg bg-sky-600 text-white font-bold text-xs';
    } else {
      b.className = 'px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs';
    }
  });
  renderClasses();
  if (window.lucide) lucide.createIcons();
}

function renderTeachers() {
  const grid = document.getElementById('teachers-grid');
  if (!grid || !appData || !appData.interns) return;

  grid.innerHTML = appData.interns.map(i => {
    const is406 = i.classId === '4-6';
    return `
      <button onclick="openTeacherModal('${i.id}')" class="glass-card rounded-2xl p-3.5 sm:p-4 text-left flex items-start space-x-3 group relative overflow-hidden ${is406 ? 'border-pink-500/30' : ''}">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
          ${i.name.charAt(0)}
        </div>
        <div class="overflow-hidden flex-1 space-y-0.5">
          <div class="flex items-center justify-between gap-1">
            <strong class="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">${i.name}</strong>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">${i.classId}</span>
          </div>
          <div class="text-xs text-slate-400 truncate">${i.dept}</div>
          <div class="text-[11px] text-teal-300 truncate">${i.subject || '教學實習'} ‧ ${i.trial || '課堂演示'}</div>
          ${is406 ? '<div class="text-[10px] text-pink-300 font-medium">💌 406 學童手繪感恩卡</div>' : ''}
        </div>
      </button>
    `;
  }).join('');
}

// --- Tab 4: Trial Teaching ---
function findTrialDocKey(name, subject) {
  if (!documentsText) return null;
  const keys = Object.keys(documentsText);
  const subKw = subject === 'math' ? '數' : '國';
  let found = keys.find(k => k.includes(name) && k.includes(subKw) && (k.includes('教案') || k.includes('演示')));
  if (!found) found = keys.find(k => k.includes(name) && (k.includes('教案') || k.includes('演示')));
  if (!found) found = keys.find(k => k.includes(name));
  return found || null;
}

function renderTrials() {
  const mathBox = document.getElementById('trials-math-container');
  const manBox = document.getElementById('trials-mandarin-container');
  if (!appData) return;

  if (mathBox && appData.mathTrials) {
    mathBox.innerHTML = appData.mathTrials.map((t, idx) => {
      const docKey = findTrialDocKey(t.name, 'math');
      const internObj = (appData.interns || []).find(i => i.name === t.name);
      return `
        <div class="glass-card rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="font-bold text-sm text-white">${idx + 1}. ${t.name} 老師 ‧ ${t.grade}</div>
            <span class="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40 text-[10px] font-bold">數學試教</span>
          </div>
          <div class="text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-1">
            <i data-lucide="book" class="w-3.5 h-3.5"></i>
            <span>${t.version || ''} ${t.unit}</span>
          </div>
          ${t.questions && t.questions.length ? `
            <div class="text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <strong class="text-amber-400 flex items-center gap-1 font-bold">
                <i data-lucide="help-circle" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>評委核心提問：</span>
              </strong>
              <div class="text-slate-300 space-y-1 pt-0.5">
                ${t.questions.map(q => `<div class="flex items-start gap-1"><span class="text-amber-400">•</span><span>${q}</span></div>`).join('')}
              </div>
            </div>
          ` : ''}
          <div class="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <strong class="text-cyan-400 flex items-center gap-1 font-bold">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>特邀評委方金雅教授現場講評：</span>
            </strong>
            <div class="text-slate-300 pt-0.5">${t.feedback || '課堂演示條理清晰，目標明確。'}</div>
          </div>
          <div class="flex items-center gap-2 pt-1 flex-wrap">
            ${docKey ? `
              <button onclick="openDocumentReader('${docKey}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium flex items-center space-x-1.5 transition">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>閱讀教案/教材真跡</span>
              </button>
            ` : (t.primaryPdf ? `
              <button onclick="handleOpenFile('${t.primaryPdf.relPath}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium flex items-center space-x-1.5 transition">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>閱讀教案真跡</span>
              </button>
            ` : '')}
            ${internObj ? `
              <button onclick="openTeacherModal('${internObj.id}')" class="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600/40 font-medium flex items-center space-x-1 transition">
                <i data-lucide="user" class="w-3.5 h-3.5"></i>
                <span>教師個人檔案</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  if (manBox && appData.mandarinTrials) {
    manBox.innerHTML = appData.mandarinTrials.map((t, idx) => {
      const docKey = findTrialDocKey(t.name, 'mandarin');
      const internObj = (appData.interns || []).find(i => i.name === t.name);
      return `
        <div class="glass-card rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="font-bold text-sm text-white">${idx + 1}. ${t.name} 老師 ‧ ${t.grade}</div>
            <span class="px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-600/40 text-[10px] font-bold">國語試教</span>
          </div>
          <div class="text-teal-300 font-bold text-xs sm:text-sm flex items-center gap-1">
            <i data-lucide="book" class="w-3.5 h-3.5"></i>
            <span>${t.version || ''} ${t.unit}</span>
          </div>
          ${t.questions && t.questions.length ? `
            <div class="text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <strong class="text-teal-400 flex items-center gap-1 font-bold">
                <i data-lucide="help-circle" class="w-3.5 h-3.5 text-teal-400"></i>
                <span>評委核心提問：</span>
              </strong>
              <div class="text-slate-300 space-y-1 pt-0.5">
                ${t.questions.map(q => `<div class="flex items-start gap-1"><span class="text-teal-400">•</span><span>${q}</span></div>`).join('')}
              </div>
            </div>
          ` : ''}
          <div class="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <strong class="text-cyan-400 flex items-center gap-1 font-bold">
              <i data-lucide="message-square" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>特邀評委方金雅教授現場講評：</span>
            </strong>
            <div class="text-slate-300 pt-0.5">${t.feedback || '課堂提問層次分明，引導生動。'}</div>
          </div>
          <div class="flex items-center gap-2 pt-1 flex-wrap">
            ${docKey ? `
              <button onclick="openDocumentReader('${docKey}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium flex items-center space-x-1.5 transition">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>閱讀教案/教材真跡</span>
              </button>
            ` : (t.primaryPdf ? `
              <button onclick="handleOpenFile('${t.primaryPdf.relPath}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium flex items-center space-x-1.5 transition">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                <span>閱讀教案真跡</span>
              </button>
            ` : '')}
            ${internObj ? `
              <button onclick="openTeacherModal('${internObj.id}')" class="px-3 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-600/40 font-medium flex items-center space-x-1 transition">
                <i data-lucide="user" class="w-3.5 h-3.5"></i>
                <span>教師個人檔案</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function switchTrialCategory(cat) {
  currentTrialSubject = cat;
  const mathBox = document.getElementById('trials-math-container');
  const manBox = document.getElementById('trials-mandarin-container');
  const btnMath = document.getElementById('btn-trial-math');
  const btnMan = document.getElementById('btn-trial-mandarin');

  if (cat === 'math') {
    if (mathBox) mathBox.classList.remove('hidden');
    if (manBox) manBox.classList.add('hidden');
    if (btnMath) btnMath.className = 'px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs';
    if (btnMan) btnMan.className = 'px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs';
  } else {
    if (mathBox) mathBox.classList.add('hidden');
    if (manBox) manBox.classList.remove('hidden');
    if (btnMath) btnMath.className = 'px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs';
    if (btnMan) btnMan.className = 'px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs';
  }
  if (window.lucide) lucide.createIcons();
}

// --- Tab 5: 52Hz Whale & Closing Ceremony ---
function renderWhale52() {
  const fbBox = document.getElementById('fb-post-showcase');
  if (fbBox && appData && appData.facebookPost) {
    const fb = appData.facebookPost;
    fbBox.innerHTML = `
      <div class="glass-card rounded-2xl p-4 sm:p-6 border border-sky-500/30 flex flex-col md:flex-row gap-5 items-start">
        <div class="w-full md:w-80 aspect-video rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 cursor-pointer shadow-lg group relative" onclick="openPhotoLightbox('closing', 0)">
          <img src="assets/facebook-post/closing_ceremony_grand_photo.jpg" alt="休業式大合影" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
            <span class="text-[11px] text-cyan-300 font-bold">點擊放大檢視大合影</span>
          </div>
        </div>
        <div class="flex-1 space-y-2.5 text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-600/40 font-bold">Facebook 官方紀實貼文</span>
            <span class="text-slate-400">${fb.date || '112.12.08'} ‧ ${fb.location || '高雄市四維國小'}</span>
          </div>
          <h3 class="text-sm sm:text-base font-bold text-white leading-snug">${fb.title || '【四維國小三週實習休業式『夢想共聲 ５２赫茲』】'}</h3>
          <div class="text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">${fb.content || ''}</div>
          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 flex-wrap gap-2">
            <span>✍️ 撰文：${fb.author || '實習總召'} (${fb.authorRole || '總召團隊'})</span>
            <button onclick="openPdfModal('assets/pdfs/四維國小三週實習休業式『夢想共聲 ５２赫茲』官方活動紀實全紀念冊-全33頁.pdf', '52赫茲官方活動紀實紀念冊 (全33頁)')" class="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-bold bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-600/40 transition">
              <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
              <span>翻閱 33 頁官方紀念冊 PDF →</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const grid = document.getElementById('ceremony-photos-grid');
  if (!grid || !appData || !appData.photoAlbums) return;

  const album = appData.photoAlbums.closing || appData.photoAlbums.ceremony;
  const photos = album?.photos || [];

  grid.innerHTML = photos.map((p, idx) => `
    <div onclick="openPhotoLightbox('closing', ${idx})" class="glass-card rounded-xl overflow-hidden cursor-pointer group">
      <div class="aspect-video overflow-hidden bg-slate-900 relative">
        <img src="${p.thumbUrl || p.relPath}" alt="${p.caption || ''}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <span class="text-[10px] text-cyan-300 font-medium">點擊展開大圖</span>
        </div>
      </div>
      <div class="p-2.5 text-xs">
        <div class="font-bold text-white truncate">${p.caption || '休業式精彩紀實'}</div>
        <div class="text-[10px] text-slate-400 mt-0.5">${p.date || '112.12.08'}</div>
      </div>
    </div>
  `).join('');
}

// --- Tab 6: Photo Gallery (Organized by Album & Dimension / Orientation) ---

function renderGallery() {
  const albumSelect = document.getElementById('album-select-chips');
  const container = document.getElementById('gallery-photos-container') || document.getElementById('gallery-photos-grid');
  if (!container || !appData || !appData.photoAlbums) return;

  const albumKeys = Object.keys(appData.photoAlbums);

  // 1. Collect photos according to current album
  let rawPhotos = [];
  if (currentAlbum === 'all') {
    albumKeys.forEach(k => {
      const alb = appData.photoAlbums[k];
      if (alb && Array.isArray(alb.photos)) {
        alb.photos.forEach(p => rawPhotos.push({ ...p, albumKey: k, albumTitle: alb.title }));
      }
    });
    // Deduplicate identical photos
    const seen = new Set();
    currentAlbumPhotos = rawPhotos.filter(p => {
      const key = p.relPath || p.id || p.thumbUrl;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } else {
    currentAlbumPhotos = (appData.photoAlbums[currentAlbum]?.photos || []).map(p => ({
      ...p,
      albumKey: currentAlbum,
      albumTitle: appData.photoAlbums[currentAlbum]?.title
    }));
  }

  // 2. Render Album Selector Chips
  if (albumSelect) {
    let totalUnique = 0;
    const allSeen = new Set();
    albumKeys.forEach(k => {
      (appData.photoAlbums[k]?.photos || []).forEach(p => {
        const key = p.relPath || p.id || p.thumbUrl;
        if (key && !allSeen.has(key)) {
          allSeen.add(key);
          totalUnique++;
        }
      });
    });

    let chipsHtml = `
      <button onclick="selectAlbum('all')" class="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${currentAlbum === 'all' ? 'bg-sky-600 text-white font-bold shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
        <span>🌟 全部相片</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentAlbum === 'all' ? 'bg-sky-800 text-white' : 'bg-slate-900 text-slate-400'}">${totalUnique}</span>
      </button>
    `;
    albumKeys.forEach(k => {
      const alb = appData.photoAlbums[k];
      const count = alb.photos?.length || 0;
      chipsHtml += `
        <button onclick="selectAlbum('${k}')" class="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${currentAlbum === k ? 'bg-sky-600 text-white font-bold shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
          <span>${escapeHtml(alb.title)}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full ${currentAlbum === k ? 'bg-sky-800 text-white' : 'bg-slate-900 text-slate-400'}">${count}</span>
        </button>
      `;
    });
    albumSelect.innerHTML = chipsHtml;
  }

  // 3. Update Orientation filter buttons styling
  const btnAll = document.getElementById('btn-orient-all');
  const btnLand = document.getElementById('btn-orient-landscape');
  const btnPort = document.getElementById('btn-orient-portrait');
  if (btnAll && btnLand && btnPort) {
    btnAll.className = `px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${currentGalleryOrientation === 'all' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;
    btnLand.className = `px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1 ${currentGalleryOrientation === 'landscape' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;
    btnPort.className = `px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1 ${currentGalleryOrientation === 'portrait' ? 'bg-sky-600 text-white shadow-sm font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;
  }

  // 4. Update Group Mode switcher styling
  const btnGroupOn = document.getElementById('btn-gallery-group-on');
  const btnGroupOff = document.getElementById('btn-gallery-group-off');
  if (btnGroupOn && btnGroupOff) {
    btnGroupOn.className = `px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${currentGalleryGroupMode ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`;
    btnGroupOff.className = `px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${!currentGalleryGroupMode ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`;
  }

  // 5. Filter photos by orientation
  let displayPhotos = currentAlbumPhotos;
  if (currentGalleryOrientation === 'landscape') {
    displayPhotos = currentAlbumPhotos.filter(p => p.orientation !== 'portrait');
  } else if (currentGalleryOrientation === 'portrait') {
    displayPhotos = currentAlbumPhotos.filter(p => p.orientation === 'portrait');
  }

  const countBadge = document.getElementById('gallery-count-badge');
  if (countBadge) {
    countBadge.innerText = `呈現 ${displayPhotos.length.toLocaleString()} 張寫真 (總庫存 ${currentAlbumPhotos.length} 張)`;
  }

  if (displayPhotos.length === 0) {
    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-8 text-center space-y-3 border border-slate-800">
        <div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
          <i data-lucide="image-off" class="w-6 h-6"></i>
        </div>
        <h3 class="text-base font-bold text-white">此篩選條件下無相片</h3>
        <p class="text-xs text-slate-400">請嘗試切換其他相簿或重設尺寸版型篩選。</p>
        <button onclick="filterGalleryOrientation('all')" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition">
          檢視全部尺寸相片
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // 6. Grouped by Dimension Mode vs Flat Grid Mode
  if (currentGalleryGroupMode && currentGalleryOrientation === 'all') {
    const landscapes = displayPhotos.filter(p => p.orientation !== 'portrait');
    const portraits = displayPhotos.filter(p => p.orientation === 'portrait');

    window.galleryLandscapes = landscapes;
    window.galleryPortraits = portraits;

    const visibleLandscapes = landscapes.slice(0, galleryDisplayLimitLandscape);
    const visiblePortraits = portraits.slice(0, galleryDisplayLimitPortrait);

    let html = '';

    // Section 1: 橫向寬幅 (Landscape 1280x960)
    if (landscapes.length > 0) {
      html += `
        <div class="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 border border-cyan-800/40 shadow-lg">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <i data-lucide="monitor" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm sm:text-base font-black text-white">橫向寬幅全景專區 (1280 × 960 / 4:3 寬屏規格)</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                    ${landscapes.length} 幅 ‧ 視角開闊
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">教學演示、觀課研習、全體大合照與教室全景，以 4:3 寬屏完美比例無損呈現</p>
              </div>
            </div>
            <button onclick="filterGalleryOrientation('landscape')" class="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
              <span>僅看橫幅 (${landscapes.length}) →</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            ${visibleLandscapes.map((p, idx) => `
              <div onclick="openGalleryGroupLightbox('landscape', ${idx})" class="glass-card rounded-xl overflow-hidden cursor-pointer group border border-slate-800/80 hover:border-cyan-400/50 transition">
                <div class="overflow-hidden bg-slate-900 relative" style="aspect-ratio: 4/3;">
                  <img src="${p.thumbUrl || p.relPath}" alt="${escapeHtml(p.caption || '')}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] text-cyan-300 font-mono font-bold border border-slate-800">
                    ${p.dimensionStr || '1280×960'}
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span class="text-[11px] text-cyan-300 font-bold flex items-center gap-1">
                      <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
                      <span>1280px 超高畫質</span>
                    </span>
                  </div>
                </div>
                <div class="p-2.5 text-xs">
                  <div class="font-bold text-white truncate" title="${escapeHtml(p.caption || '')}">${escapeHtml(p.caption || '實習活動相片')}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5 truncate flex items-center justify-between">
                    <span>${escapeHtml(p.albumTitle || p.subAlbum || '')}</span>
                    <span class="text-slate-500">${p.date || ''}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          ${landscapes.length > visibleLandscapes.length ? `
            <div class="pt-3 text-center">
              <button onclick="loadMoreGalleryLandscape()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-sky-950 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500 text-xs font-bold transition inline-flex items-center gap-2 shadow-md">
                <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
                <span>載入更多橫幅寫真 (尚有 ${landscapes.length - visibleLandscapes.length} 幅)</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Section 2: 直向立幅 (Portrait 960x1280)
    if (portraits.length > 0) {
      html += `
        <div class="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 border border-rose-800/40 shadow-lg">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-rose-950 border border-rose-500/40 flex items-center justify-center text-pink-300">
                <i data-lucide="smartphone" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm sm:text-base font-black text-white">直向立幅寫真與學生手繪卡 (960 × 1280 / 3:4 直立規格)</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-pink-300 border border-rose-500/40 font-bold">
                    ${portraits.length} 幅 ‧ 筆跡完整不裁切
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">406 班學童真跡手繪卡、指導教授與實習教師立面特寫，以 3:4 縱向比例呈現，文字與筆跡完整無裁切</p>
              </div>
            </div>
            <button onclick="filterGalleryOrientation('portrait')" class="text-xs font-bold text-pink-300 hover:text-pink-200 flex items-center gap-1 transition bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
              <span>僅看直幅卡片 (${portraits.length}) →</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            ${visiblePortraits.map((p, idx) => `
              <div onclick="openGalleryGroupLightbox('portrait', ${idx})" class="glass-card rounded-xl overflow-hidden cursor-pointer group border border-slate-800/80 hover:border-pink-400/50 transition">
                <div class="overflow-hidden bg-slate-900 relative" style="aspect-ratio: 3/4;">
                  <img src="${p.thumbUrl || p.relPath}" alt="${escapeHtml(p.caption || '')}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] text-pink-300 font-mono font-bold border border-slate-800">
                    ${p.dimensionStr || '960×1280'}
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span class="text-[11px] text-pink-300 font-bold flex items-center gap-1">
                      <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
                      <span>完整立幅放大</span>
                    </span>
                  </div>
                </div>
                <div class="p-2 text-xs">
                  <div class="font-bold text-white truncate" title="${escapeHtml(p.caption || '')}">${escapeHtml(p.caption || '立幅寫真')}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5 truncate flex items-center justify-between">
                    <span>${escapeHtml(p.albumTitle || p.subAlbum || '')}</span>
                    <span class="text-slate-500">${p.date || ''}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          ${portraits.length > visiblePortraits.length ? `
            <div class="pt-3 text-center">
              <button onclick="loadMoreGalleryPortrait()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-pink-300 hover:text-white border border-slate-700 hover:border-pink-500 text-xs font-bold transition inline-flex items-center gap-2 shadow-md">
                <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
                <span>載入更多直幅寫真 (尚有 ${portraits.length - visiblePortraits.length} 幅)</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    container.innerHTML = html;
  } else {
    // Mode B: Flat Grid (or Single Orientation selected)
    window.galleryActiveList = displayPhotos;
    const isPortraitOnly = currentGalleryOrientation === 'portrait';
    const gridCols = isPortraitOnly
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

    const visiblePhotos = displayPhotos.slice(0, galleryDisplayLimitLandscape);

    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 border border-sky-800/40 shadow-lg">
        <div class="grid ${gridCols} gap-3 sm:gap-4">
          ${visiblePhotos.map((p, idx) => {
            const isPort = p.orientation === 'portrait';
            const aspectStyle = isPort ? 'aspect-ratio: 3/4;' : 'aspect-ratio: 4/3;';
            const badgeColor = isPort ? 'text-pink-300 bg-rose-950/80 border-rose-800' : 'text-cyan-300 bg-slate-950/80 border-slate-800';

            return `
              <div onclick="openGalleryGroupLightbox('active', ${idx})" class="glass-card rounded-xl overflow-hidden cursor-pointer group border border-slate-800/80 hover:border-cyan-400/50 transition">
                <div class="overflow-hidden bg-slate-900 relative" style="${aspectStyle}">
                  <img src="${p.thumbUrl || p.relPath}" alt="${escapeHtml(p.caption || '')}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded backdrop-blur text-[10px] font-mono font-bold border ${badgeColor}">
                    ${p.dimensionStr || (isPort ? '960×1280' : '1280×960')}
                  </span>
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span class="text-[11px] text-cyan-300 font-bold flex items-center gap-1">
                      <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
                      <span>1280px 檢視</span>
                    </span>
                  </div>
                </div>
                <div class="p-2.5 text-xs">
                  <div class="font-bold text-white truncate" title="${escapeHtml(p.caption || '')}">${escapeHtml(p.caption || '實習活動相片')}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5 truncate flex items-center justify-between">
                    <span>${escapeHtml(p.albumTitle || p.subAlbum || '')}</span>
                    <span class="text-slate-500">${p.date || ''}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${displayPhotos.length > visiblePhotos.length ? `
          <div class="pt-3 text-center">
            <button onclick="loadMoreGalleryContinuous()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-sky-950 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500 text-xs font-bold transition inline-flex items-center gap-2 shadow-md">
              <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
              <span>載入更多寫真 (尚有 ${displayPhotos.length - visiblePhotos.length} 幅)</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function selectAlbum(albumKey) {
  currentAlbum = albumKey;
  galleryDisplayLimitLandscape = 60;
  galleryDisplayLimitPortrait = 80;
  renderGallery();
}

function openGalleryGroupLightbox(type, index) {
  let list = [];
  if (type === 'landscape') {
    list = window.galleryLandscapes || [];
  } else if (type === 'portrait') {
    list = window.galleryPortraits || [];
  } else if (type === 'active') {
    list = window.galleryActiveList || [];
  } else {
    list = currentAlbumPhotos;
  }
  if (!list || list.length === 0) return;
  window.activeLightboxPhotos = list;
  currentPhotoIndex = index;
  updateLightboxView();
  const modal = document.getElementById('photo-modal');
  if (modal) modal.classList.remove('hidden');
}

function filterGalleryOrientation(orient) {
  currentGalleryOrientation = orient;
  galleryDisplayLimitLandscape = 60;
  galleryDisplayLimitPortrait = 80;
  renderGallery();
}

function toggleGalleryGroupMode(isGrouped) {
  currentGalleryGroupMode = isGrouped;
  renderGallery();
}

function loadMoreGalleryLandscape() {
  galleryDisplayLimitLandscape += 60;
  renderGallery();
}

function loadMoreGalleryPortrait() {
  galleryDisplayLimitPortrait += 60;
  renderGallery();
}

function loadMoreGalleryContinuous() {
  galleryDisplayLimitLandscape += 60;
  renderGallery();
}

// --- Tab 7: Files Archive (Categorized & Dimension-Specified Architecture) ---

const FILE_CATEGORIES = [
  { key: 'all', name: '全部分類', icon: 'layers', color: 'sky', badgeCls: 'bg-sky-950 text-sky-300 border-sky-600/40', desc: '依文獻類型與照片尺寸分區呈現全站 1,302 份數位檔案典藏' },
  { key: 'plan', name: '實習計畫書', icon: 'book', color: 'blue', badgeCls: 'bg-blue-950 text-blue-300 border-blue-600/40', desc: '各班三週教學規劃與行政工作分配 (13 份 A4)' },
  { key: 'lesson', name: '公開試教教案', icon: 'pen-tool', color: 'teal', badgeCls: 'bg-teal-950 text-teal-300 border-teal-600/40', desc: '國語、數學公開試教演示正式教案 (176 份 A4)' },
  { key: 'journal', name: '手札週誌 (KWLQ)', icon: 'edit-3', color: 'emerald', badgeCls: 'bg-emerald-950 text-emerald-300 border-emerald-600/40', desc: '實習教師 1~3 週深度教育省思週記 (51 份 A4)' },
  { key: 'report', name: '期末心得報告', icon: 'graduation-cap', color: 'indigo', badgeCls: 'bg-indigo-950 text-indigo-300 border-indigo-600/40', desc: '三週教育實習個人成果完整報告 (25 份 A4)' },
  { key: 'album', name: '特輯紀念冊', icon: 'image', color: 'rose', badgeCls: 'bg-rose-950 text-rose-300 border-rose-600/40', desc: '52Hz紀念冊、406卡片集與成果冊 (30 份 A4/特輯)' },
  { key: 'manual', name: '手冊與評量', icon: 'clipboard-list', color: 'amber', badgeCls: 'bg-amber-950 text-amber-300 border-amber-600/40', desc: '行政須知、日程表、互評與評量表 (49 份 A4)' },
  { key: 'photo_landscape', name: '橫向寬幅寫真', icon: 'monitor', color: 'cyan', badgeCls: 'bg-cyan-950 text-cyan-300 border-cyan-600/40', desc: '1280×960 寬屏教學花絮與大合照 (876 幅)' },
  { key: 'photo_portrait', name: '直向立幅卡片', icon: 'smartphone', color: 'pink', badgeCls: 'bg-pink-950 text-pink-300 border-pink-600/40', desc: '960×1280 406學生手繪感念卡與立幅寫真 (80 幅)' },
  { key: 'video', name: '影音多媒體實錄', icon: 'video', color: 'purple', badgeCls: 'bg-purple-950 text-purple-300 border-purple-600/40', desc: '學童課間健康操律動與日常花絮 (2 部 720p)' }
];

function renderCategoryCards() {
  const cardsBox = document.getElementById('file-category-cards');
  if (!cardsBox) return;
  const specificCats = FILE_CATEGORIES.filter(c => c.key !== 'all');

  cardsBox.innerHTML = specificCats.map(cat => {
    const count = (allFiles || []).filter(f => f.categoryKey === cat.key).length;
    const isActive = currentFileFilter === cat.key;
    return `
      <div onclick="filterFilesCategory('${cat.key}')" class="glass-card rounded-2xl p-2.5 sm:p-3 cursor-pointer transition border ${isActive ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50' : 'border-slate-800 hover:border-slate-700'} flex flex-col justify-between group">
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center text-xs group-hover:scale-110 transition-transform">
            <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-cyan-400"></i>
          </div>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-300 border border-slate-700'}">
            ${count}
          </span>
        </div>
        <div>
          <div class="text-[11px] sm:text-xs font-bold text-white truncate group-hover:text-cyan-300 transition">${cat.name}</div>
          <div class="text-[9px] text-slate-400 truncate mt-0.5">${cat.desc}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCategoryPills() {
  const pillsBox = document.getElementById('file-category-pills');
  if (!pillsBox) return;

  pillsBox.innerHTML = FILE_CATEGORIES.map(cat => {
    const count = cat.key === 'all' ? (allFiles || []).length : (allFiles || []).filter(f => f.categoryKey === cat.key).length;
    const isActive = currentFileFilter === cat.key;
    return `
      <button onclick="filterFilesCategory('${cat.key}')" data-file-filter="${cat.key}" class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${isActive ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
        <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i>
        <span>${cat.name}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-sky-800 text-white' : 'bg-slate-900 text-slate-400'}">${count}</span>
      </button>
    `;
  }).join('');
}

function filterFilesDimension(dim) {
  currentFileDimensionFilter = dim;
  filesCategoryPageLimit = 36;
  const btns = {
    all: document.getElementById('btn-dim-all'),
    document: document.getElementById('btn-dim-doc'),
    landscape: document.getElementById('btn-dim-land'),
    portrait: document.getElementById('btn-dim-port'),
    video: document.getElementById('btn-dim-vid')
  };
  Object.keys(btns).forEach(k => {
    const el = btns[k];
    if (el) {
      if (k === dim) {
        el.className = 'px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition bg-sky-600 text-white shadow-sm';
      } else {
        el.className = 'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition bg-slate-800 text-slate-300 hover:bg-slate-700';
      }
    }
  });
  renderFilesArchive();
}

function renderFilesArchive() {
  renderCategoryCards();
  renderCategoryPills();

  const container = document.getElementById('files-archive-container');
  if (!container) return;

  const searchVal = (document.getElementById('file-search-input')?.value || '').toLowerCase().trim();

  // Filter items across categories, grades, dimensions and search term
  let filtered = (allFiles || []).filter(f => {
    if (currentFileFilter !== 'all' && f.categoryKey !== currentFileFilter) return false;
    if (currentFileGradeFilter !== 'all' && f.grade !== currentFileGradeFilter) return false;
    if (currentFileDimensionFilter !== 'all') {
      if (currentFileDimensionFilter === 'document' && f.orientation !== 'document') return false;
      if (currentFileDimensionFilter === 'landscape' && f.orientation !== 'landscape') return false;
      if (currentFileDimensionFilter === 'portrait' && f.orientation !== 'portrait') return false;
      if (currentFileDimensionFilter === 'video' && f.orientation !== 'video') return false;
    }
    if (searchVal) {
      const matchName = f.name && f.name.toLowerCase().includes(searchVal);
      const matchTitle = f.title && f.title.toLowerCase().includes(searchVal);
      const matchAuthor = f.author && f.author.toLowerCase().includes(searchVal);
      const matchGrade = f.grade && f.grade.toLowerCase().includes(searchVal);
      const matchClass = f.classId && f.classId.toLowerCase().includes(searchVal);
      const matchCat = f.categoryName && f.categoryName.toLowerCase().includes(searchVal);
      const matchDim = (f.dimensionStr && f.dimensionStr.toLowerCase().includes(searchVal)) || (f.sizeLabel && f.sizeLabel.toLowerCase().includes(searchVal));
      if (!matchName && !matchTitle && !matchAuthor && !matchGrade && !matchClass && !matchCat && !matchDim) return false;
    }
    return true;
  });

  const totalBadge = document.getElementById('files-total-badge');
  if (totalBadge) {
    totalBadge.innerText = `篩選共 ${filtered.length.toLocaleString()} 份檔案 (總典藏 ${(allFiles || []).length.toLocaleString()} 份)`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-8 text-center space-y-3 border border-slate-800">
        <div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-cyan-400">
          <i data-lucide="file-question" class="w-6 h-6"></i>
        </div>
        <h3 class="text-base font-bold text-white">查無符合條件的數位檔案</h3>
        <p class="text-xs text-slate-400">找不到符合目前條件的檔案，請嘗試清除關鍵字或切換尺寸規格。</p>
        <button onclick="resetFileFilters()" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition">
          重設所有篩選條件
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // --- MODE A: Categorized Grouped Sections when 'all' is selected ---
  if (currentFileFilter === 'all') {
    let sectionsHtml = '';
    const activeCats = FILE_CATEGORIES.filter(c => c.key !== 'all');

    activeCats.forEach(cat => {
      const catFiles = filtered.filter(f => f.categoryKey === cat.key);
      if (catFiles.length === 0) return;

      const isLong = catFiles.length > 9 && !searchVal;
      const displayFiles = isLong ? catFiles.slice(0, 9) : catFiles;

      sectionsHtml += `
        <div class="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 border border-slate-800/90 shadow-lg">
          <!-- Section Header -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm sm:text-base font-black text-white">${cat.name}</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full ${cat.badgeCls} font-bold border">
                    ${catFiles.length} 份
                  </span>
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">${cat.desc}</p>
              </div>
            </div>

            ${isLong ? `
              <button onclick="filterFilesCategory('${cat.key}')" class="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 shadow-sm">
                <span>檢視全部 ${catFiles.length} 份 →</span>
              </button>
            ` : ''}
          </div>

          <!-- Section Body -->
          ${currentFileViewMode === 'card' ? renderFileCardsGrid(displayFiles) : renderFileTable(displayFiles)}

          ${isLong ? `
            <div class="pt-2 text-center">
              <button onclick="filterFilesCategory('${cat.key}')" class="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-sky-950 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/50 text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm">
                <i data-lucide="arrow-down-right" class="w-3.5 h-3.5"></i>
                <span>展開「${cat.name}」全部 ${catFiles.length} 份檔案專頁</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = sectionsHtml;
  } else {
    // --- MODE B: Single Category Detail View with Grade Sub-filters ---
    const activeCatObj = FILE_CATEGORIES.find(c => c.key === currentFileFilter) || FILE_CATEGORIES[1];
    const displayFiles = filtered.slice(0, filesCategoryPageLimit);

    let html = `
      <div class="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 border border-cyan-600/30 shadow-lg">
        <!-- Category Banner -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <i data-lucide="${activeCatObj.icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base sm:text-lg font-black text-white">${activeCatObj.name}</h3>
                <span class="text-xs px-2.5 py-0.5 rounded-full ${activeCatObj.badgeCls} font-bold border">
                  共 ${filtered.length} 份
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">${activeCatObj.desc}</p>
            </div>
          </div>

          <!-- Grade Sub-filter Pills -->
          <div class="flex items-center space-x-1.5 touch-scroll">
            <span class="text-[11px] text-slate-400 mr-1 hidden sm:inline">年級快速篩選:</span>
            ${['all', '低年級', '中年級', '高年級', '全校性'].map(gr => `
              <button onclick="filterFilesGrade('${gr}')" class="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${currentFileGradeFilter === gr ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                ${gr === 'all' ? '全部年級' : gr}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Content -->
        ${currentFileViewMode === 'card' ? renderFileCardsGrid(displayFiles) : renderFileTable(displayFiles)}

        ${filtered.length > displayFiles.length ? `
          <div class="pt-3 text-center">
            <button onclick="loadMoreFilesCategory()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-sky-950 text-cyan-300 hover:text-white border border-slate-700 hover:border-cyan-500 text-xs font-bold transition inline-flex items-center gap-2 shadow-md">
              <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
              <span>載入更多檔案 (尚有 ${filtered.length - displayFiles.length} 份)</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  if (window.lucide) lucide.createIcons();
}

function loadMoreFilesCategory() {
  filesCategoryPageLimit += 36;
  renderFilesArchive();
}

function renderFileCardsGrid(files) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      ${files.map(f => {
        const isPdf = f.ext === '.pdf';
        const isVideo = f.ext === '.mp4';
        const isPhoto = f.isPhoto || /\.(jpg|jpeg|png|webp)$/i.test(f.ext);
        const isPortrait = f.orientation === 'portrait';

        let extBadge = 'bg-blue-950 text-blue-300 border border-blue-600/40';
        let extLabel = 'WORD';
        if (isPdf) {
          extBadge = 'bg-rose-950 text-rose-300 border border-rose-600/40';
          extLabel = 'PDF';
        } else if (isVideo) {
          extBadge = 'bg-purple-950 text-purple-300 border border-purple-600/40';
          extLabel = 'MP4';
        } else if (isPhoto) {
          if (isPortrait) {
            extBadge = 'bg-pink-950 text-pink-300 border border-pink-600/40';
            extLabel = '直幅卡片';
          } else {
            extBadge = 'bg-cyan-950 text-cyan-300 border border-cyan-600/40';
            extLabel = '寬幅寫真';
          }
        }

        // Dimension Badge
        let dimBadge = '';
        if (f.orientation === 'document') {
          dimBadge = `<span class="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/30 text-[10px] text-blue-300 font-mono">📄 A4 規格</span>`;
        } else if (f.orientation === 'landscape') {
          dimBadge = `<span class="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono font-bold">🖼️ ${f.dimensionStr || '1280×960'}</span>`;
        } else if (f.orientation === 'portrait') {
          dimBadge = `<span class="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/30 text-[10px] text-pink-300 font-mono font-bold">📱 ${f.dimensionStr || '960×1280'}</span>`;
        } else if (f.orientation === 'video') {
          dimBadge = `<span class="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-[10px] text-purple-300 font-mono font-bold">🎬 720p HD</span>`;
        }

        return `
          <div class="glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between border border-slate-800 hover:border-cyan-500/40 transition group">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-[11px] gap-2">
                <span class="px-2 py-0.5 rounded-lg font-bold ${extBadge}">
                  ${extLabel}
                </span>
                <div class="flex items-center gap-1.5 text-slate-400">
                  ${dimBadge}
                  ${f.grade && f.grade !== '全校性' ? `<span class="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-[10px] text-slate-300 border border-slate-700">${f.grade}</span>` : ''}
                  ${f.classId ? `<span class="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-[10px] text-cyan-300 font-bold border border-slate-700">${f.classId} 班</span>` : ''}
                </div>
              </div>

              ${isPhoto ? `
                <div onclick="handleOpenFile('${escapeHtml(f.relPath)}')" class="overflow-hidden rounded-xl bg-slate-950 cursor-pointer relative group/img ${isPortrait ? 'h-44' : 'aspect-video'}">
                  <img src="${f.thumbUrl || f.relPath}" alt="${escapeHtml(f.name)}" loading="lazy" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300">
                  <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-xs text-white font-bold px-2 py-1 rounded bg-black/70 flex items-center gap-1">
                      <i data-lucide="zoom-in" class="w-3.5 h-3.5 text-cyan-400"></i>
                      <span>點擊放大檢視</span>
                    </span>
                  </div>
                </div>
              ` : (isVideo ? `
                <div onclick="handleOpenFile('${escapeHtml(f.relPath)}')" class="aspect-video overflow-hidden rounded-xl bg-purple-950/40 border border-purple-800/40 cursor-pointer flex flex-col items-center justify-center gap-1 group/vid">
                  <i data-lucide="play-circle" class="w-10 h-10 text-purple-400 group-hover/vid:scale-110 transition-transform"></i>
                  <span class="text-[11px] text-purple-300 font-bold">播放 720p 影音實況</span>
                </div>
              ` : '')}

              <h4 class="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition" title="${escapeHtml(f.name)}">
                ${escapeHtml(f.title || f.name)}
              </h4>

              <div class="text-[11px] text-slate-400 flex items-center justify-between gap-1.5 truncate">
                <div class="flex items-center gap-1 truncate">
                  <i data-lucide="user" class="w-3 h-3 text-slate-500 flex-shrink-0"></i>
                  <span class="truncate">${f.author || '實習輔導組'}</span>
                </div>
                <span class="text-[10px] text-slate-500 flex-shrink-0">${f.sizeFormatted || ''}</span>
              </div>

              ${f.hasText ? `
                <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-[10px] text-teal-300 font-medium">
                  <i data-lucide="sparkles" class="w-3 h-3 text-teal-400"></i>
                  <span>支援 KWLQ 全文真跡</span>
                </div>
              ` : ''}
            </div>

            <div class="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button onclick="handleOpenFile('${escapeHtml(f.relPath)}')" class="flex-1 px-3 py-1.5 rounded-xl bg-sky-950 hover:bg-sky-900 text-sky-300 hover:text-white border border-sky-600/40 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
                <i data-lucide="${isPhoto ? 'maximize' : (isVideo ? 'play-circle' : 'book-open')}" class="w-3.5 h-3.5"></i>
                <span>${isPhoto ? '檢視高畫質寫真' : (isVideo ? '播放影音實況' : (f.hasText ? '閱讀全文' : '線上閱讀'))}</span>
              </button>
              ${f.isLocalAsset ? `
                <a href="${f.relPath}" target="_blank" class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700" title="新分頁開啟 / 下載">
                  <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                </a>
              ` : ''}
              ${f.originalDocPath ? `
                <span class="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg" title="原始檔: ${f.originalDocName}">附Word</span>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderFileTable(files) {
  return `
    <div class="glass-card rounded-2xl overflow-hidden border border-slate-800">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th class="py-3 px-3 sm:px-4">檔案名稱 / 標題</th>
            <th class="py-3 px-3 sm:px-4 hidden sm:table-cell">版型規格 / 尺寸</th>
            <th class="py-3 px-3 sm:px-4 hidden md:table-cell">實習教師</th>
            <th class="py-3 px-3 sm:px-4 hidden lg:table-cell">年級 / 班級</th>
            <th class="py-3 px-3 sm:px-4 hidden xl:table-cell">檔案大小</th>
            <th class="py-3 px-3 sm:px-4 text-right">線上操作</th>
          </tr>
        </thead>
        <tbody>
          ${files.map(f => {
            const isVideo = f.ext === '.mp4';
            const isPhoto = f.isPhoto || /\.(jpg|jpeg|png|webp)$/i.test(f.ext);
            const isPortrait = f.orientation === 'portrait';

            let iconName = 'file-text';
            let iconColor = 'text-cyan-400';
            let dimBadge = `<span class="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/30 text-[10px] text-blue-300 font-mono">📄 A4 規格</span>`;

            if (isVideo) {
              iconName = 'video';
              iconColor = 'text-purple-400';
              dimBadge = `<span class="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-[10px] text-purple-300 font-mono">🎬 720p HD</span>`;
            } else if (isPhoto) {
              iconName = isPortrait ? 'smartphone' : 'image';
              iconColor = isPortrait ? 'text-pink-400' : 'text-cyan-400';
              dimBadge = isPortrait
                ? `<span class="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/30 text-[10px] text-pink-300 font-mono">📱 ${f.dimensionStr || '960×1280'}</span>`
                : `<span class="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">🖼️ ${f.dimensionStr || '1280×960'}</span>`;
            }

            return `
              <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition text-xs">
                <td class="py-3 px-3 sm:px-4">
                  <div class="font-bold text-white flex items-center gap-2">
                    <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor} flex-shrink-0"></i>
                    <span class="truncate max-w-xs sm:max-w-md">${escapeHtml(f.title || f.name)}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 sm:hidden mt-0.5 flex items-center gap-1.5">
                    <span>${f.author || ''}</span>
                    <span>‧</span>
                    <span>${f.dimensionStr || f.sizeLabel}</span>
                  </div>
                </td>
                <td class="py-3 px-3 sm:px-4 hidden sm:table-cell whitespace-nowrap">
                  ${dimBadge}
                </td>
                <td class="py-3 px-3 sm:px-4 text-slate-300 hidden md:table-cell whitespace-nowrap">
                  ${f.author || '實習輔導組'}
                </td>
                <td class="py-3 px-3 sm:px-4 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                  ${f.grade || '全校性'} ${f.classId ? `(${f.classId})` : ''}
                </td>
                <td class="py-3 px-3 sm:px-4 text-slate-400 hidden xl:table-cell whitespace-nowrap font-mono text-[11px]">
                  ${f.sizeFormatted || ''}
                </td>
                <td class="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                  <div class="inline-flex items-center gap-1.5">
                    <button onclick="handleOpenFile('${escapeHtml(f.relPath)}')" class="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600/40 font-bold transition text-xs">
                      ${isPhoto ? '檢視寫真' : (isVideo ? '播放' : (f.hasText ? '閱讀全文' : '閱讀'))}
                    </button>
                    ${f.isLocalAsset ? `
                      <a href="${f.relPath}" target="_blank" class="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition" title="新分頁開啟">
                        <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                      </a>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function switchFileViewMode(mode) {
  currentFileViewMode = mode;
  const btnCard = document.getElementById('btn-view-card');
  const btnTable = document.getElementById('btn-view-table');
  if (btnCard && btnTable) {
    if (mode === 'card') {
      btnCard.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white transition flex items-center gap-1';
      btnTable.className = 'px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1';
    } else {
      btnCard.className = 'px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition flex items-center gap-1';
      btnTable.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white transition flex items-center gap-1';
    }
  }
  renderFilesArchive();
}

function filterFilesCategory(cat) {
  currentFileFilter = cat;
  currentFileGradeFilter = 'all';
  filesCategoryPageLimit = 36;
  renderFilesArchive();
}

function filterFilesGrade(grade) {
  currentFileGradeFilter = grade;
  filesCategoryPageLimit = 36;
  renderFilesArchive();
}

function resetFileFilters() {
  currentFileFilter = 'all';
  currentFileGradeFilter = 'all';
  currentFileDimensionFilter = 'all';
  filterFilesDimension('all');
  const searchInput = document.getElementById('file-search-input');
  if (searchInput) searchInput.value = '';
  renderFilesArchive();
}

// --- Modals and Viewers ---

// 1. Teacher Modal
function openTeacherModal(teacherId) {
  const teacher = (appData.interns || []).find(i => i.id === teacherId || i.name === teacherId);
  if (!teacher) return;

  const modal = document.getElementById('teacher-modal');
  if (!modal) return;

  document.getElementById('tm-avatar').innerText = teacher.name.charAt(0);
  document.getElementById('tm-name').innerText = teacher.name + ' 老師';
  document.getElementById('tm-class').innerText = teacher.classId + ' 實習班級';
  document.getElementById('tm-dept').innerText = teacher.dept || '';
  document.getElementById('tm-subject').innerText = (teacher.subject || '教學實習') + '領域';
  document.getElementById('tm-trial').innerText = teacher.trial || '課堂公開教學演示';

  // 406 cards special section for class 406 teachers (李沛錞 & 鄭凱瀚)
  const is406 = teacher.classId === '4-6';
  const cardSection = document.getElementById('tm-406-card-section');
  if (cardSection) {
    if (is406 && appData.photoAlbums?.cards406) {
      cardSection.classList.remove('hidden');
      const cards = appData.photoAlbums.cards406.photos || [];
      const cardGrid = document.getElementById('tm-406-cards-grid');
      if (cardGrid) {
        cardGrid.innerHTML = cards.map((c, idx) => `
          <div onclick="openPhotoLightbox('cards406', ${idx})" class="glass-card rounded-lg overflow-hidden cursor-pointer group">
            <div class="aspect-3/4 overflow-hidden bg-slate-900">
              <img src="${c.thumbUrl || c.relPath}" alt="406感恩卡" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
            </div>
            <div class="p-1 text-[10px] text-center text-slate-300 font-medium truncate">${c.caption || '感恩卡'}</div>
          </div>
        `).join('');
      }
    } else {
      cardSection.classList.add('hidden');
    }
  }

  // Teacher photos
  const photoGrid = document.getElementById('tm-photos-grid');
  const tMedia = teacherMedia[teacher.id] || null;
  if (photoGrid && tMedia && Array.isArray(tMedia.photos) && tMedia.photos.length > 0) {
    photoGrid.innerHTML = tMedia.photos.slice(0, 16).map((p, idx) => `
      <div onclick="openPhotoLightbox('teacher_${teacher.id}', ${idx})" class="glass-card rounded-lg overflow-hidden cursor-pointer group">
        <div class="aspect-4/3 overflow-hidden bg-slate-900">
          <img src="${p.thumbUrl || p.relPath}" alt="${p.caption || ''}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
        </div>
        <div class="p-1 text-[10px] text-center text-slate-300 truncate">${p.caption || '實習寫真'}</div>
      </div>
    `).join('');
  } else if (photoGrid) {
    photoGrid.innerHTML = '<div class="text-xs text-slate-400 py-3 col-span-4 text-center">尚無關聯相片</div>';
  }

  // Documents (Journals, Report, Lesson Plan, Teacher PDF Album)
  const docContainer = document.getElementById('tm-documents-list');
  if (docContainer) {
    let docsHtml = '';
    const allDocKeys = Object.keys(documentsText || {});
    const teacherDocKeys = allDocKeys.filter(k => k.includes(teacher.name));

    const journals = teacherDocKeys.filter(k => k.includes('手札'));
    const reports = teacherDocKeys.filter(k => k.includes('心得報告') || k.includes('實習報告'));
    const others = teacherDocKeys.filter(k => !journals.includes(k) && !reports.includes(k));

    journals.forEach((k, idx) => {
      const doc = documentsText[k];
      const title = doc.title || pathBasename(k);
      let label = `✍️ 實習手札第 ${idx + 1} 週 (KWLQ)`;
      if (title.includes('一') || title.includes('1')) label = '✍️ 第一週實習手札 (KWLQ)';
      else if (title.includes('二') || title.includes('2')) label = '✍️ 第二週實習手札 (KWLQ)';
      else if (title.includes('三') || title.includes('3')) label = '✍️ 第三週實習手札 (KWLQ)';
      else if (title.includes('一至三')) label = '✍️ 第一至三週實習手札 (KWLQ)';

      docsHtml += `
        <button onclick="openDocumentReader('${k}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between transition border border-slate-700/60">
          <div>
            <div class="font-bold text-white text-xs">${label}</div>
            <div class="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">${title}</div>
          </div>
          <span class="text-[10px] text-cyan-300 font-medium whitespace-nowrap ml-2">閱讀全文</span>
        </button>
      `;
    });

    reports.forEach((k) => {
      const doc = documentsText[k];
      const title = doc.title || pathBasename(k);
      docsHtml += `
        <button onclick="openDocumentReader('${k}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between transition border border-slate-700/60">
          <div>
            <div class="font-bold text-white text-xs">🎓 期末實習心得報告</div>
            <div class="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">${title}</div>
          </div>
          <span class="text-[10px] text-cyan-300 font-medium whitespace-nowrap ml-2">閱讀全文</span>
        </button>
      `;
    });

    others.forEach((k) => {
      const doc = documentsText[k];
      const title = doc.title || pathBasename(k);
      docsHtml += `
        <button onclick="openDocumentReader('${k}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left flex items-center justify-between transition border border-slate-700/60">
          <div>
            <div class="font-bold text-white text-xs">📐 試教教案 / 學習單</div>
            <div class="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">${title}</div>
          </div>
          <span class="text-[10px] text-cyan-300 font-medium whitespace-nowrap ml-2">閱讀全文</span>
        </button>
      `;
    });

    // Individual photo album PDF
    const paddedId = String(teacher.id).padStart(2, '0');
    const teacherPdfPath = `assets/pdfs/teachers/${paddedId}_${teacher.name}-光影相簿.pdf`;
    docsHtml += `
      <button onclick="openPdfModal('${teacherPdfPath}', '${teacher.name} 老師 - 數位光影相簿')" class="px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-left flex items-center justify-between transition">
        <div>
          <div class="font-bold text-cyan-200 text-xs">📸 個人專屬光影相簿 (PDF)</div>
          <div class="text-[10px] text-cyan-400">典藏個人精選光影與活動寫真</div>
        </div>
        <span class="text-[10px] text-cyan-300 font-bold whitespace-nowrap ml-2">翻閱相簿</span>
      </button>
    `;

    // If 406 teacher, add button for 52 cards album PDF
    if (is406) {
      docsHtml += `
        <button onclick="openPdfModal('assets/pdfs/四年六班全體學生手繪感恩卡全集數位典藏冊-全52頁.pdf', '四年六班全體學生手繪感恩卡全集數位典藏冊 (全52頁)')" class="px-3 py-2 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-500/40 text-left flex items-center justify-between transition">
          <div>
            <div class="font-bold text-pink-200 text-xs">💌 406 全班 52 份手繪感恩卡數位典藏冊 (PDF)</div>
            <div class="text-[10px] text-pink-400">全52頁高畫質純真手繪感恩原件</div>
          </div>
          <span class="text-[10px] text-pink-300 font-bold whitespace-nowrap ml-2">翻閱全冊</span>
        </button>
      `;
    }

    docContainer.innerHTML = docsHtml || '<div class="text-xs text-slate-400 py-2">尚無典藏公文</div>';
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

// 2. Photo Lightbox
function openPhotoLightbox(albumKey, index) {
  let photoList = [];
  if (albumKey === 'current') {
    photoList = currentAlbumPhotos;
  } else if (albumKey === 'cards406') {
    photoList = appData.photoAlbums?.cards406?.photos || [];
  } else if (albumKey === 'ceremony' || albumKey === 'closing') {
    photoList = appData.photoAlbums?.closing?.photos || appData.photoAlbums?.ceremony?.photos || [];
  } else if (albumKey.startsWith('teacher_')) {
    const tId = albumKey.replace('teacher_', '');
    photoList = teacherMedia[tId]?.photos || [];
  } else if (appData.photoAlbums && appData.photoAlbums[albumKey]) {
    photoList = appData.photoAlbums[albumKey].photos || [];
  }

  if (!photoList || photoList.length === 0) return;
  currentPhotoIndex = index;
  window.activeLightboxPhotos = photoList;

  updateLightboxView();
  const modal = document.getElementById('photo-modal');
  if (modal) modal.classList.remove('hidden');
}

function updateLightboxView() {
  const photoList = window.activeLightboxPhotos || [];
  if (!photoList[currentPhotoIndex]) return;

  const photo = photoList[currentPhotoIndex];
  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-title');
  const counterEl = document.getElementById('lightbox-counter');

  if (imgEl) {
    const isLocalAsset = photo.relPath && photo.relPath.startsWith('assets/');
    imgEl.src = isLocalAsset ? photo.relPath : (photo.thumbUrl || photo.relPath);
  }
  if (titleEl) {
    const isPort = photo.orientation === 'portrait';
    const dimBadge = `<span class="text-[10px] px-2 py-0.5 rounded-full mr-2 font-mono font-bold ${isPort ? 'bg-rose-950 text-pink-300 border border-rose-500/50' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'}">${isPort ? '📱 直幅立面 960×1280' : '🖼️ 橫幅寬屏 1280×960'}</span>`;
    titleEl.innerHTML = dimBadge + escapeHtml(photo.caption || photo.name || '光影相簿寫真');
  }
  if (counterEl) {
    counterEl.innerText = `${currentPhotoIndex + 1} / ${photoList.length}`;
  }
}

function nextLightboxPhoto() {
  const list = window.activeLightboxPhotos || [];
  if (currentPhotoIndex < list.length - 1) {
    currentPhotoIndex++;
    updateLightboxView();
  }
}

function prevLightboxPhoto() {
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
    updateLightboxView();
  }
}

// 3. Document Reader
function openDocumentReader(docKey) {
  const doc = documentsText[docKey];
  if (!doc) return;

  const modal = document.getElementById('document-modal');
  if (!modal) return;

  const authorName = doc.teacherName || doc.author || '實習教師';
  const authorDept = doc.dept ? ` (${doc.dept})` : '';
  const classInfo = doc.classId ? ` ‧ ${doc.classId} 班` : '';
  document.getElementById('doc-title').innerText = doc.title || pathBasename(docKey);
  document.getElementById('doc-author').innerText = `${authorName}${authorDept}${classInfo} ‧ ${doc.category || '教育實習真跡'}`;

  const contentBox = document.getElementById('doc-content-body');
  if (contentBox) {
    let bodyHtml = '';
    const fullText = Array.isArray(doc.pages) ? doc.pages.join('\n\n') : (doc.rawText || '');

    const hasKWLQ = /(已知的認識|想知道的|學到的\s*內\s*容|學到的內容|提問\s*-|KWLQ)/i.test(fullText);

    if (hasKWLQ) {
      const kwlqRegex = /(已知的認識\s*\(?Know,\s*K\)?|想知道的\s*\(?Want\s*to,\s*W\)?|學到的\s*內容\s*\(?Learn,\s*L\)?|學到的\s*內\s*容\s*\(?Learn,\s*L\)?|提問\s*-\s*仍不清楚處\s*\(?Question,\s*Q\)?|實\s*習\s*照\s*片)/i;
      const parts = fullText.split(kwlqRegex);

      if (parts[0] && parts[0].trim()) {
        bodyHtml += `
          <div class="p-4 rounded-xl mb-3 bg-slate-100 border border-slate-300/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
            ${escapeHtml(parts[0].trim())}
          </div>
        `;
      }

      for (let i = 1; i < parts.length; i += 2) {
        const heading = parts[i];
        const content = (parts[i + 1] || '').trim();
        let cls = 'p-4 rounded-xl mb-3 ';
        let icon = '📌';

        if (heading.includes('Know') || heading.includes('已知的認識')) {
          cls += 'kwlq-box-k';
          icon = '💡';
        } else if (heading.includes('Want') || heading.includes('想知道的')) {
          cls += 'kwlq-box-w';
          icon = '❓';
        } else if (heading.includes('Learn') || heading.includes('學到的')) {
          cls += 'kwlq-box-l';
          icon = '🌱';
        } else if (heading.includes('Question') || heading.includes('提問')) {
          cls += 'kwlq-box-q';
          icon = '🔍';
        } else {
          cls += 'bg-slate-50 border border-slate-200';
          icon = '📷';
        }

        bodyHtml += `
          <div class="${cls}">
            <h4 class="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <span>${icon}</span>
              <span>${escapeHtml(heading)}</span>
            </h4>
            <div class="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">${escapeHtml(content)}</div>
          </div>
        `;
      }
    } else if (Array.isArray(doc.pages) && doc.pages.length > 0) {
      bodyHtml = doc.pages.map((pText, idx) => `
        <div class="p-4 sm:p-5 rounded-2xl mb-4 bg-slate-50 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 text-xs text-sky-700 font-bold">
            <span>📄 第 ${idx + 1} 頁</span>
            <span class="text-slate-400">共 ${doc.pages.length} 頁</span>
          </div>
          <div class="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">${escapeHtml(pText)}</div>
        </div>
      `).join('');
    } else {
      bodyHtml = `<div class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-xl">${escapeHtml(fullText || '此公文無文字內容')}</div>`;
    }

    contentBox.innerHTML = bodyHtml;
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function handleOpenFile(relPath) {
  if (!relPath) return;
  const base = pathBasename(relPath);

  // 1. Check if video (.mp4)
  if (relPath.toLowerCase().endsWith('.mp4')) {
    let videoSrc = relPath;
    if (window.location.protocol.startsWith('http')) {
      videoSrc = '/media/' + relPath;
    } else {
      videoSrc = 'G:/我的雲端硬碟/112上-小教教學實習-20260830T083306Z-1-001/112上-小教教學實習/' + relPath;
    }
    openVideoModal(videoSrc, base);
    return;
  }

  // 2. Check in documentsText (Structured KWLQ or pure authentic text)
  const matchedKey = Object.keys(documentsText || {}).find(k => {
    return k === relPath || k.includes(base) || (documentsText[k].title && documentsText[k].title.includes(base));
  });

  if (matchedKey) {
    openDocumentReader(matchedKey);
    return;
  }

  // 3. Check if PDF
  if (relPath.toLowerCase().endsWith('.pdf')) {
    openPdfModal(relPath, base);
    return;
  }

  // 5. Check if image
  if (/\.(jpg|jpeg|png|webp)$/i.test(relPath)) {
    const matchedFile = (allFiles || []).find(f => f.relPath === relPath || f.name === base);
    let thumbUrl = matchedFile?.thumbUrl || '';
    let orientation = matchedFile?.orientation || 'landscape';
    let caption = matchedFile?.title || matchedFile?.name || base;

    if (!thumbUrl) {
      for (const albKey in appData.photoAlbums || {}) {
        const p = (appData.photoAlbums[albKey].photos || []).find(x => x.relPath === relPath || x.fileName === base);
        if (p) { thumbUrl = p.thumbUrl || p.relPath; orientation = p.orientation || orientation; caption = p.caption || caption; break; }
      }
    }
    if (!thumbUrl) {
      for (const tId in teacherMedia || {}) {
        const p = (teacherMedia[tId].photos || []).find(x => x.relPath === relPath || x.fileName === base);
        if (p) { thumbUrl = p.thumbUrl || p.relPath; orientation = p.orientation || orientation; caption = p.caption || caption; break; }
      }
    }
    window.activeLightboxPhotos = [{ caption, thumbUrl: thumbUrl || relPath, relPath, orientation }];
    currentPhotoIndex = 0;
    updateLightboxView();
    const modal = document.getElementById('photo-modal');
    if (modal) modal.classList.remove('hidden');
    return;
  }
}

function openVideoModal(videoSrc, title) {
  const modal = document.getElementById('video-modal');
  const player = document.getElementById('video-player');
  const titleEl = document.getElementById('video-title');
  if (!modal || !player) return;
  if (titleEl) titleEl.innerText = title || '實習影音實況';
  player.src = videoSrc;
  modal.classList.remove('hidden');
  player.play().catch(() => {});
  if (window.lucide) lucide.createIcons();
}

function pathBasename(p) {
  return (p || '').split(/[/\\\\]/).pop();
}

// ==========================================
// Vector PDF.js Online Reader Engine
// ==========================================
let currentPdfDoc = null;
let currentPdfPage = 1;
let currentPdfNumPages = 1;
let currentPdfScale = 1.0;
let currentPdfIsFitWidth = true;
let currentPdfViewMode = 'single'; // 'single' | 'continuous'
let isRenderingPdf = false;
let currentPdfUrl = '';
let currentPdfTitle = '';
let pdfRenderTask = null;

function resolvePdfPath(relPath, base) {
  if (!relPath) return 'assets/pdfs/' + (base || '');
  if (relPath.startsWith('assets/pdfs/')) return relPath;
  if (relPath.includes('teachers') || (base && base.includes('-光影相簿.pdf'))) {
    return 'assets/pdfs/teachers/' + (base || pathBasename(relPath));
  }
  return 'assets/pdfs/' + (base || pathBasename(relPath));
}

function updatePdfPageUI() {
  const pageInput = document.getElementById('pdf-page-input');
  const totalPagesEl = document.getElementById('pdf-total-pages');
  const prevBtn = document.getElementById('pdf-prev-btn');
  const nextBtn = document.getElementById('pdf-next-btn');
  const zoomText = document.getElementById('pdf-zoom-text');
  const modeText = document.getElementById('pdf-mode-text');

  if (pageInput) pageInput.value = currentPdfPage;
  if (totalPagesEl) totalPagesEl.innerText = currentPdfNumPages;
  if (prevBtn) prevBtn.disabled = currentPdfPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPdfPage >= currentPdfNumPages;

  if (zoomText) {
    if (currentPdfIsFitWidth) {
      zoomText.innerText = '適應';
    } else {
      zoomText.innerText = Math.round(currentPdfScale * 100) + '%';
    }
  }
  if (modeText) {
    modeText.innerText = currentPdfViewMode === 'single' ? '單頁翻閱' : '連續捲動';
  }
}

async function openPdfModal(pdfUrl, title) {
  const modal = document.getElementById('pdf-modal');
  const iframe = document.getElementById('pdf-iframe');
  const canvasContainer = document.getElementById('pdf-canvas-container');
  const spinner = document.getElementById('pdf-loading-spinner');
  const titleEl = document.getElementById('pdf-title');
  const downloadLink = document.getElementById('pdf-download-link');

  const base = pathBasename(pdfUrl);
  const normalizedUrl = resolvePdfPath(pdfUrl, base);
  currentPdfUrl = normalizedUrl;
  currentPdfTitle = title || base || '實習文件 PDF 檢視';

  if (titleEl) titleEl.innerText = currentPdfTitle;
  if (downloadLink) downloadLink.href = normalizedUrl;
  if (iframe) iframe.src = normalizedUrl;

  if (modal) modal.classList.remove('hidden');
  if (spinner) spinner.classList.remove('hidden');
  if (canvasContainer) {
    canvasContainer.innerHTML = '';
    canvasContainer.classList.remove('hidden');
  }
  if (iframe) iframe.classList.add('hidden');

  currentPdfPage = 1;
  currentPdfNumPages = 1;
  currentPdfScale = 1.0;
  currentPdfIsFitWidth = true;
  updatePdfPageUI();

  if (window.lucide) lucide.createIcons();

  // High-Performance Vector PDF.js Canvas Rendering
  if (window.pdfjsLib) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      const loadingTask = pdfjsLib.getDocument({
        url: normalizedUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
      });

      const pdf = await loadingTask.promise;
      currentPdfDoc = pdf;
      currentPdfNumPages = pdf.numPages;
      currentPdfPage = 1;
      updatePdfPageUI();

      if (spinner) spinner.classList.add('hidden');

      if (currentPdfViewMode === 'single') {
        await renderSinglePdfPage(currentPdfPage);
      } else {
        await renderAllPdfPages();
      }
      return;
    } catch (err) {
      console.warn('PDF.js rendering failed, falling back to native iframe reader:', err);
    }
  }

  // Graceful Fallback: Native iframe reader
  if (spinner) spinner.classList.add('hidden');
  if (canvasContainer) canvasContainer.classList.add('hidden');
  if (iframe) {
    iframe.classList.remove('hidden');
    iframe.src = normalizedUrl;
  }
}

async function renderSinglePdfPage(pageNum = 1) {
  if (!currentPdfDoc || isRenderingPdf) return;
  isRenderingPdf = true;

  if (pdfRenderTask) {
    try { pdfRenderTask.cancel(); } catch (e) {}
    pdfRenderTask = null;
  }

  const containerEl = document.getElementById('pdf-canvas-container');
  if (!containerEl) { isRenderingPdf = false; return; }
  containerEl.innerHTML = '';

  pageNum = Math.max(1, Math.min(pageNum, currentPdfNumPages));
  currentPdfPage = pageNum;
  updatePdfPageUI();

  const containerWidth = Math.max(containerEl.clientWidth - (window.innerWidth < 640 ? 16 : 48), 260);
  const containerHeight = Math.max(containerEl.clientHeight - (window.innerWidth < 640 ? 16 : 48), 320);
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

  try {
    const page = await currentPdfDoc.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1.0 });

    let scale = currentPdfScale;
    if (currentPdfIsFitWidth) {
      const widthScale = (containerWidth / originalViewport.width) * 0.98;
      if (window.innerWidth < 768) {
        scale = widthScale;
      } else {
        const heightScale = (containerHeight / originalViewport.height) * 0.96;
        scale = Math.min(widthScale, heightScale * 1.35);
      }
      currentPdfScale = scale;
    }

    const viewport = page.getViewport({ scale });
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'pdf-page-wrapper relative bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-700/60 my-auto flex-shrink-0 flex items-center justify-center transition-transform duration-200';
    pageWrapper.dataset.pageNum = pageNum;
    pageWrapper.style.width = Math.floor(viewport.width) + 'px';
    pageWrapper.style.height = Math.floor(viewport.height) + 'px';

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    pageWrapper.appendChild(canvas);
    containerEl.appendChild(pageWrapper);

    const ctx = canvas.getContext('2d', { alpha: false });
    const renderContext = {
      canvasContext: ctx,
      transform: [dpr, 0, 0, dpr, 0, 0],
      viewport: viewport
    };

    pdfRenderTask = page.render(renderContext);
    await pdfRenderTask.promise;
  } catch (e) {
    if (e?.name !== 'RenderingCancelledException') {
      console.warn('Single page render error:', e);
    }
  } finally {
    isRenderingPdf = false;
    updatePdfPageUI();
  }
}

async function renderAllPdfPages() {
  if (!currentPdfDoc || isRenderingPdf) return;
  isRenderingPdf = true;

  const containerEl = document.getElementById('pdf-canvas-container');
  if (!containerEl) { isRenderingPdf = false; return; }
  containerEl.innerHTML = '';

  const containerWidth = Math.max(containerEl.clientWidth - (window.innerWidth < 640 ? 16 : 48), 260);
  const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

  try {
    for (let pageNum = 1; pageNum <= currentPdfNumPages; pageNum++) {
      const page = await currentPdfDoc.getPage(pageNum);
      let scale = currentPdfScale;
      if (currentPdfIsFitWidth) {
        scale = (containerWidth / page.view[2]) * 0.98;
      }

      const viewport = page.getViewport({ scale });
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'pdf-page-wrapper relative bg-white shadow-xl rounded-xl overflow-hidden border border-slate-700/60 mb-6 flex-shrink-0';
      pageWrapper.dataset.pageNum = pageNum;
      pageWrapper.style.width = Math.floor(viewport.width) + 'px';
      pageWrapper.style.height = Math.floor(viewport.height) + 'px';

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      pageWrapper.appendChild(canvas);
      containerEl.appendChild(pageWrapper);

      const ctx = canvas.getContext('2d', { alpha: false });
      const renderContext = {
        canvasContext: ctx,
        transform: [dpr, 0, 0, dpr, 0, 0],
        viewport: viewport
      };

      await page.render(renderContext).promise;
    }
  } catch (e) {
    console.warn('All pages render error:', e);
  } finally {
    isRenderingPdf = false;
    updatePdfPageUI();
  }
}

function prevPdfPage() {
  if (currentPdfPage > 1) {
    renderSinglePdfPage(currentPdfPage - 1);
  }
}

function nextPdfPage() {
  if (currentPdfPage < currentPdfNumPages) {
    renderSinglePdfPage(currentPdfPage + 1);
  }
}

function goToPdfPage(val) {
  const p = parseInt(val, 10);
  if (!isNaN(p)) {
    renderSinglePdfPage(Math.max(1, Math.min(p, currentPdfNumPages)));
  }
}

function zoomInPdf() {
  currentPdfIsFitWidth = false;
  currentPdfScale = Math.min(3.0, (currentPdfScale || 1.0) * 1.25);
  if (currentPdfViewMode === 'single') {
    renderSinglePdfPage(currentPdfPage);
  } else {
    renderAllPdfPages();
  }
}

function zoomOutPdf() {
  currentPdfIsFitWidth = false;
  currentPdfScale = Math.max(0.4, (currentPdfScale || 1.0) * 0.8);
  if (currentPdfViewMode === 'single') {
    renderSinglePdfPage(currentPdfPage);
  } else {
    renderAllPdfPages();
  }
}

function toggleFitWidthPdf() {
  currentPdfIsFitWidth = true;
  if (currentPdfViewMode === 'single') {
    renderSinglePdfPage(currentPdfPage);
  } else {
    renderAllPdfPages();
  }
}

function togglePdfViewMode() {
  currentPdfViewMode = currentPdfViewMode === 'single' ? 'continuous' : 'single';
  updatePdfPageUI();
  if (currentPdfViewMode === 'single') {
    renderSinglePdfPage(currentPdfPage);
  } else {
    renderAllPdfPages();
  }
}

function closeModals() {
  document.querySelectorAll('.app-modal').forEach(m => m.classList.add('hidden'));
  const videoPlayer = document.getElementById('video-player');
  if (videoPlayer) {
    videoPlayer.pause();
    videoPlayer.src = '';
  }
  if (pdfRenderTask) {
    try { pdfRenderTask.cancel(); } catch (e) {}
    pdfRenderTask = null;
  }
  const canvasContainer = document.getElementById('pdf-canvas-container');
  if (canvasContainer) canvasContainer.innerHTML = '';
}

// Keyboard Navigation for PDF Reader
window.addEventListener('keydown', (e) => {
  const pdfModal = document.getElementById('pdf-modal');
  if (pdfModal && !pdfModal.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevPdfPage();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextPdfPage();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomInPdf();
    } else if (e.key === '-') {
      e.preventDefault();
      zoomOutPdf();
    } else if (e.key === 'Escape') {
      closeModals();
    }
  }
});

// Window Resize Auto-Refit for PDF
let pdfResizeTimeout = null;
window.addEventListener('resize', () => {
  const pdfModal = document.getElementById('pdf-modal');
  if (pdfModal && !pdfModal.classList.contains('hidden') && currentPdfDoc && currentPdfIsFitWidth) {
    clearTimeout(pdfResizeTimeout);
    pdfResizeTimeout = setTimeout(() => {
      if (currentPdfViewMode === 'single') {
        renderSinglePdfPage(currentPdfPage);
      }
    }, 200);
  }
});

// --- Global Search ---
function handleGlobalSearch(q) {
  q = (q || '').toLowerCase().trim();
  const resBox = document.getElementById('global-search-results');
  const resList = document.getElementById('search-results-list');
  const clearBtn = document.getElementById('clear-search-btn');

  if (!q) {
    if (resBox) resBox.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }
  if (clearBtn) clearBtn.classList.remove('hidden');

  const matchedInterns = (appData?.interns || []).filter(i => 
    i.name.includes(q) || i.classId.includes(q) || (i.dept && i.dept.toLowerCase().includes(q))
  );

  const matchedClasses = (appData?.classes || []).filter(c => 
    c.className.includes(q) || c.mentor.includes(q) || c.id.includes(q)
  );

  let html = '';
  matchedInterns.forEach(i => {
    html += `
      <div onclick="openTeacherModal('${i.id}'); closeSearchResults();" class="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 cursor-pointer flex justify-between items-center text-xs">
        <div><strong class="text-white">${i.name} 老師</strong> <span class="text-cyan-300">(${i.classId} ‧ ${i.subject})</span></div>
        <span class="text-[10px] text-slate-400">${i.dept}</span>
      </div>
    `;
  });

  matchedClasses.forEach(c => {
    html += `
      <div onclick="switchTab('classes'); closeSearchResults();" class="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 cursor-pointer flex justify-between items-center text-xs">
        <div><strong class="text-white">${c.className}</strong> <span class="text-slate-400">導師：${c.mentor}</span></div>
        <span class="text-[10px] text-cyan-300">班級實習</span>
      </div>
    `;
  });

  if (resList) {
    resList.innerHTML = html || '<div class="text-xs text-slate-400 text-center py-2">查無符合關鍵字項目</div>';
  }
  if (resBox) resBox.classList.remove('hidden');
}

function clearGlobalSearch() {
  const input = document.getElementById('global-search');
  if (input) input.value = '';
  handleGlobalSearch('');
}

function closeSearchResults() {
  const resBox = document.getElementById('global-search-results');
  if (resBox) resBox.classList.add('hidden');
}

// --- Web Audio Synthesizer Engine ---
let audioMasterCtx = null;
function getAudioContext() {
  if (!audioMasterCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioMasterCtx = new AudioContextClass();
      window.audioMasterCtx = audioMasterCtx;
    }
  }
  if (audioMasterCtx && audioMasterCtx.state === 'suspended') {
    try { audioMasterCtx.resume(); } catch(e){}
  }
  return audioMasterCtx;
}

async function ensureAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try { await ctx.resume(); } catch(e){}
  }
  return ctx;
}

const DeepSeaAmbient = {
  isPlaying: false,
  isMutedByUser: false,
  noiseNode: null,
  noiseFilter: null,
  noiseLfo: null,
  droneOscs: [],
  masterGain: null,
  chimeTimer: null,

  async start() {
    if (this.isPlaying) return;
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Dynamics Compressor to prevent distortion on all speakers
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-12, now);
      comp.knee.setValueAtTime(8, now);
      comp.ratio.setValueAtTime(4, now);
      comp.attack.setValueAtTime(0.005, now);
      comp.release.setValueAtTime(0.1, now);
      comp.connect(ctx.destination);

      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.linearRampToValueAtTime(0.18, now + 1.2);
      this.masterGain.connect(comp);

      // 1. Ocean Swell Waves (Brown/Pink Noise + LFO Filter 230 - 670 Hz)
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 4.5;
      }

      this.noiseNode = ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseFilter = ctx.createBiquadFilter();
      this.noiseFilter.type = 'lowpass';
      this.noiseFilter.frequency.setValueAtTime(320, now);
      this.noiseFilter.Q.setValueAtTime(2.2, now);

      this.noiseLfo = ctx.createOscillator();
      this.noiseLfo.frequency.setValueAtTime(0.08, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(220, now);
      this.noiseLfo.connect(lfoGain);
      lfoGain.connect(this.noiseFilter.frequency);
      this.noiseLfo.start(now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.35, now);
      this.noiseNode.connect(this.noiseFilter);
      this.noiseFilter.connect(nGain);
      nGain.connect(this.masterGain);
      this.noiseNode.start(now);

      // 2. 52Hz Ocean Harmonic Resonance (52, 104, 156, 208, 312 Hz)
      this.droneOscs = [];
      const chord = [
        { f: 52, g: 0.35, t: 'sine' },
        { f: 104, g: 0.30, t: 'sine' },
        { f: 156, g: 0.22, t: 'sine' },
        { f: 208, g: 0.16, t: 'triangle' },
        { f: 312, g: 0.12, t: 'sine' }
      ];
      chord.forEach(c => {
        const osc = ctx.createOscillator();
        osc.type = c.t;
        osc.frequency.setValueAtTime(c.f, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(c.g, now);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        this.droneOscs.push(osc);
      });

      // 3. Pentatonic Echo Water Droplets
      const pentatonic = [392, 440, 523, 659, 784];
      const playChime = () => {
        if (!this.isPlaying) return;
        try {
          const cNow = ctx.currentTime;
          const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, cNow);
          const cg = ctx.createGain();
          cg.gain.setValueAtTime(0.0001, cNow);
          cg.gain.linearRampToValueAtTime(0.14, cNow + 0.04);
          cg.gain.exponentialRampToValueAtTime(0.0001, cNow + 1.5);
          osc.connect(cg);
          cg.connect(this.masterGain);
          osc.start(cNow);
          osc.stop(cNow + 1.7);
        } catch(e){}
      };
      setTimeout(playChime, 1000);
      this.chimeTimer = setInterval(playChime, 4500);

      this.isPlaying = true;
      this.updateUI(true);
    } catch(e){
      console.error('Ambient audio error:', e);
    }
  },

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.updateUI(false);
    if (this.chimeTimer) { clearInterval(this.chimeTimer); this.chimeTimer = null; }
    const ctx = audioMasterCtx;
    if (ctx && this.masterGain) {
      try {
        const now = ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      } catch(e){}
    }
    const oNoise = this.noiseNode; const oLfo = this.noiseLfo; const oOscs = this.droneOscs;
    setTimeout(() => {
      try {
        if (oNoise) { oNoise.stop(); oNoise.disconnect(); }
        if (oLfo) { oLfo.stop(); oLfo.disconnect(); }
        oOscs.forEach(o => { try{o.stop();o.disconnect();}catch(e){} });
      } catch(e){}
    }, 500);
  },

  async toggle() {
    if (this.isPlaying) {
      this.isMutedByUser = true;
      this.stop();
    } else {
      this.isMutedByUser = false;
      await this.start();
    }
  },

  updateUI(playing) {
    const text = document.getElementById('ambient-btn-text');
    const icon = document.getElementById('ambient-icon-wrapper');
    if (text) {
      text.innerText = playing ? '深海環境音樂：播放中 🎵' : (this.isMutedByUser ? '深海環境音樂：已暫停 ⏸️' : '深海環境音樂：點擊啟動 🎵');
    }
    if (icon) {
      icon.innerHTML = playing ?
        '<span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span>' :
        '<i data-lucide="waves" class="w-4 h-4 text-teal-400"></i>';
      if (window.lucide) lucide.createIcons();
    }
  }
};

const BlueWhaleEngine = {
  isPlaying: false,
  phraseTimer: null,
  activeGain: null,

  async triggerWhaleCall() {
    if (this.isPlaying) { this.stop(); return; }
    const ctx = await ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (!DeepSeaAmbient.isMutedByUser && !DeepSeaAmbient.isPlaying) DeepSeaAmbient.start();

    this.isPlaying = true;
    this.updateButtons(true);
    this.playPhrase();
    this.phraseTimer = setInterval(() => { if (this.isPlaying) this.playPhrase(); }, 7500);
  },

  playPhrase() {
    const ctx = audioMasterCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const callGain = ctx.createGain();
    callGain.gain.setValueAtTime(0.0001, now);
    callGain.gain.linearRampToValueAtTime(0.48, now + 0.6);
    callGain.gain.setValueAtTime(0.48, now + 2.2);
    callGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.6);
    this.activeGain = callGain;

    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(4.5, now);
    filter.gain.setValueAtTime(6.0, now);

    [52, 104, 156, 208, 260, 312].forEach(freq => {
      const osc = ctx.createOscillator();
      const ratio = freq / 52;
      osc.frequency.setValueAtTime(52 * ratio, now);
      osc.frequency.linearRampToValueAtTime(64 * ratio, now + 1.2);
      osc.frequency.setValueAtTime(64 * ratio, now + 2.0);
      osc.frequency.exponentialRampToValueAtTime(46 * ratio, now + 4.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4 / (ratio * 0.8), now);
      osc.connect(g);
      g.connect(callGain);
      osc.start(now);
      osc.stop(now + 4.8);
    });

    callGain.connect(filter);
    filter.connect(ctx.destination);
  },

  stop() {
    this.isPlaying = false;
    if (this.phraseTimer) { clearInterval(this.phraseTimer); this.phraseTimer = null; }
    if (this.activeGain && audioMasterCtx) {
      try {
        this.activeGain.gain.linearRampToValueAtTime(0.0001, audioMasterCtx.currentTime + 0.2);
      } catch(e){}
    }
    this.updateButtons(false);
  },

  updateButtons(playing) {
    const btns = ['btn-ov-52hz', 'btn-special-52hz'];
    btns.forEach(id => {
      const b = document.getElementById(id);
      if (b) {
        b.innerHTML = playing ?
          '<i data-lucide="volume-x" class="w-4 h-4 text-amber-300"></i><span>🐋 藍鯨 52Hz 詠唱中 (點擊暫停)</span>' :
          '<i data-lucide="volume-2" class="w-4 h-4"></i><span>聆聽 52Hz 藍鯨呼喚音</span>';
      }
    });
    if (window.lucide) lucide.createIcons();
  }
};

window.DeepSeaAmbient = DeepSeaAmbient;
window.BlueWhaleEngine = BlueWhaleEngine;
function toggleDeepSeaAmbient() { DeepSeaAmbient.toggle(); }
function toggle52HzAudio() { BlueWhaleEngine.triggerWhaleCall(); }

// --- Event Listeners ---
function setupGlobalEvents() {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleGlobalSearch(e.target.value));
  }

  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('photo-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e.key === 'ArrowRight') nextLightboxPhoto();
    else if (e.key === 'ArrowLeft') prevLightboxPhoto();
    else if (e.key === 'Escape') closeModals();
  });

  const unlockAudio = async () => {
    await ensureAudioContext();
    ['click', 'touchstart', 'keydown'].forEach(evt => window.removeEventListener(evt, unlockAudio, true));
  };
  ['click', 'touchstart', 'keydown'].forEach(evt => window.addEventListener(evt, unlockAudio, { once: true, capture: true, passive: true }));
}
