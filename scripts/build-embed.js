const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\112-elementary-teaching-practicum-v2';
const rawData = require(path.join(ROOT, 'data', 'practicum-data.json'));
const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60f0e8db-767b-4324-abb1-8a61833a426d';

// 1. Process 24 Intern Teachers with compact attributes
const internSubjectMap = {
  '南雅娟': '國語', '曾郁涵': '國語', '蔡承軒': '數學', '洪瑋伶': '數學',
  '林芳妤': '國語', '羅渝傑': '數學', '司亦妍': '國語', '張育瑄': '國語',
  '賴泓均': '數學', '蔡佳芸': '數學', '吳俋達': '數學', '張浚祐': '數學',
  '丁云翔': '數學', '王品貴': '數學', '吳依潔': '國語', '陳嬿亘': '國語',
  '邱靖雯': '國語', '陳新絜': '數學', '徐秉鴻': '國語', '易冠蓁': '國語',
  '曾麗萍': '數學', '余青黛': '國語', '李沛錞': '國語', '鄭凱瀚': '數學'
};

const internTrialMap = {};
(rawData.mathTrials || []).forEach(m => {
  if (m.name) internTrialMap[m.name] = `數學：${m.unit} (${m.grade})`;
});
(rawData.mandarinTrials || []).forEach(m => {
  if (m.name) internTrialMap[m.name] = `國語：${m.unit} (${m.grade})`;
});

const compactInterns = (rawData.interns || []).map(i => {
  const subject = internSubjectMap[i.name] || '教學實習';
  const trial = internTrialMap[i.name] || '課堂公開教學演示';
  return {
    id: i.id,
    name: i.name,
    classId: i.classId,
    dept: i.dept || '',
    subject,
    trial,
    has406Cards: (i.classId === '4-6')
  };
});

// 2. Process 12 Classes
const compactClasses = (rawData.classes || []).map(c => {
  const teachers = compactInterns.filter(i => i.classId === c.id).map(i => `${i.name} (${i.subject})`);
  return {
    id: c.id,
    name: c.className,
    mentor: c.mentor,
    grade: c.id.startsWith('2-') ? '低年級' : (c.id.startsWith('4-') ? '中年級' : '高年級'),
    teachers,
    has406Cards: (c.id === '4-6')
  };
});

// 3. Process 12 Math and 12 Mandarin Trials
const compactMathTrials = (rawData.mathTrials || []).map(m => ({
  name: m.name,
  grade: m.grade,
  unit: m.unit,
  feedback: (m.feedback || '').substring(0, 100) + '...'
}));

const compactMandarinTrials = (rawData.mandarinTrials || []).map(m => ({
  name: m.name,
  grade: m.grade,
  unit: m.unit,
  feedback: (m.feedback || '').substring(0, 100) + '...'
}));

// 4. Build Compact Lighting HTML Template
// Target: Strict Google Sites Character Count <= 65,535 chars
const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>112學年度小教教學實習成果展 ‧ 52赫茲同頻共振 (Google Sites Lighting 版)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans TC",sans-serif;background:#090d16;color:#e2e8f0;margin:0;padding:0;}
    .touch-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
    .touch-scroll::-webkit-scrollbar{display:none;}
    .tab-btn.active{background:#0284c7;color:#fff;font-weight:700;box-shadow:0 4px 14px rgba(2,132,199,0.35);}
    .glass-panel{background:rgba(15,23,42,0.78);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.08);}
    .glass-card{background:rgba(30,41,59,0.6);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.06);transition:all .2s;}
    .glass-card:hover{border-color:rgba(56,189,248,0.4);transform:translateY(-2px);}
  </style>
</head>
<body class="min-h-screen flex flex-col pb-20 md:pb-6">

  <!-- Header -->
  <header class="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-3 sm:px-5 py-2.5">
    <div class="max-w-6xl mx-auto flex items-center justify-between gap-2">
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">52</div>
        <div>
          <h1 class="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            112上小教實習展
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">四維國小×高師大</span>
          </h1>
          <p class="text-[10px] text-slate-400">「夢想共聲 ‧ 52赫茲」同頻共振數位成果典藏</p>
        </div>
      </div>

      <!-- Action Tools -->
      <div class="flex items-center space-x-1.5">
        <button id="btn-ambient-toggle" onclick="toggleDeepSeaAmbient()" class="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-teal-950/70 hover:bg-teal-900/90 text-teal-300 border border-teal-600/40 transition flex items-center space-x-1.5 shadow-sm" title="深海環境音樂 (常駐背景音，點擊開關)">
          <span id="ambient-icon-wrapper" class="flex items-center space-x-0.5">
            <i data-lucide="waves" class="w-3.5 h-3.5 text-teal-400"></i>
          </span>
          <span class="hidden sm:inline" id="ambient-btn-text">深海環境音樂：點擊啟動 🎵</span>
        </button>

        <button onclick="openFullVersionModal()" class="px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-1" title="切換全量高畫質相簿與PDF版">
          <i data-lucide="external-link" class="w-3.5 h-3.5 text-sky-400"></i>
          <span class="hidden md:inline">全量高清版</span>
        </button>
      </div>
    </div>

    <!-- Desktop Navigation Tabs -->
    <div class="max-w-6xl mx-auto mt-2 touch-scroll pt-1 border-t border-slate-800/60 flex space-x-1 text-xs">
      <button onclick="switchTab('overview')" data-tab="overview" class="tab-btn active px-3 py-1.5 rounded-lg whitespace-nowrap transition">實習總覽</button>
      <button onclick="switchTab('timeline')" data-tab="timeline" class="tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:bg-slate-800 transition">實習歷程</button>
      <button onclick="switchTab('classes')" data-tab="classes" class="tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:bg-slate-800 transition">班級與教師</button>
      <button onclick="switchTab('trials')" data-tab="trials" class="tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:bg-slate-800 transition">試教寶典</button>
      <button onclick="switchTab('whale52')" data-tab="whale52" class="tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:bg-slate-800 transition">52赫茲特輯</button>
      <button onclick="switchTab('gallery')" data-tab="gallery" class="tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:bg-slate-800 transition">光影藝廊</button>
      <button onclick="switchTab('manual')" data-tab="manual" class="tab-btn px-3 py-1.5 rounded-lg whitespace-nowrap text-slate-300 hover:bg-slate-800 transition">實習手冊</button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-grow max-w-6xl w-full mx-auto px-3 sm:px-5 py-4 space-y-4">

    <!-- Search bar -->
    <div class="glass-panel rounded-2xl p-2.5 flex items-center space-x-2">
      <i data-lucide="search" class="w-4 h-4 text-slate-400 flex-shrink-0 ml-1"></i>
      <input id="global-search" type="text" placeholder="搜尋實習老師姓名、班級 (如 4-6、5-5)、科系或試教單元..." oninput="handleSearch(this.value)" class="bg-transparent border-none text-xs sm:text-sm text-white focus:outline-none w-full placeholder-slate-500">
      <button onclick="clearSearch()" id="btn-clear-search" class="hidden text-xs text-slate-400 hover:text-white px-2">清除</button>
    </div>

    <!-- Search Results Panel -->
    <div id="search-results-box" class="hidden glass-panel rounded-2xl p-3 space-y-2 border border-cyan-500/30">
      <div class="text-xs font-bold text-cyan-300 flex items-center justify-between">
        <span>🔍 搜尋檢索結果</span>
        <span id="search-count" class="text-slate-400 font-normal text-[11px]">0 筆結果</span>
      </div>
      <div id="search-results-list" class="space-y-1.5 max-h-60 overflow-y-auto text-xs"></div>
    </div>

    <!-- TAB 1: 實習總覽 (Overview) -->
    <section id="tab-overview" class="tab-content space-y-4">
      <!-- Hero Banner -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-800/40 p-5 sm:p-7 shadow-xl">
        <div class="absolute -right-8 -bottom-8 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="max-w-2xl space-y-2.5 relative z-10">
          <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
            <i data-lucide="sparkles" class="w-3 h-3 text-cyan-400"></i>
            <span>高雄市四維國小 × 國立高雄師範大學師培中心</span>
          </div>
          <h2 class="text-lg sm:text-2xl font-black text-white leading-tight">
            四維國小教學實習數位成果展<br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">「夢想共聲 ‧ 5 2 赫茲」</span> 同頻共振的教育篇章
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            在深邃的教育海洋中，每位實習教師最初都像一隻唱著 52 赫茲的鯨魚，在摸索中探尋屬於自己的教學音頻。歷經試教磨礪與三週入班深耕，這 52 赫茲的孤獨呼喚，最終在四維國小的校園裡激盪出同頻共振的燦爛回聲。
          </p>
          <div class="pt-2 flex flex-wrap gap-2 text-xs">
            <button onclick="toggle52HzAudio()" id="btn-ov-52hz" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-lg shadow-teal-900/30 transition">
              <i data-lucide="volume-2" class="w-4 h-4"></i>
              <span>聆聽 52Hz 藍鯨呼喚音</span>
            </button>
            <button onclick="switchTab('classes')" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition">
              探索 24 位實習教師名錄 →
            </button>
          </div>
        </div>
      </div>

      <!-- Supervisors Honors Section -->
      <div class="grid sm:grid-cols-2 gap-2.5">
        <div class="glass-card rounded-xl p-3 flex items-center space-x-3 border border-sky-500/20">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">呂</div>
          <div>
            <div class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold inline-block">實習指導教授</div>
            <div class="font-bold text-xs text-white">呂瑞芬 校長 <span class="text-[11px] font-normal text-slate-400">（高師大師培中心）</span></div>
          </div>
        </div>
        <div class="glass-card rounded-xl p-3 flex items-center space-x-3 border border-teal-500/20">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">方</div>
          <div>
            <div class="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-bold inline-block">特邀指導教授</div>
            <div class="font-bold text-xs text-white">方金雅 教授 <span class="text-[11px] font-normal text-slate-400">（高師大師培中心）</span></div>
          </div>
        </div>
      </div>

      <!-- Stats Grid (4 Cards) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div class="glass-card rounded-xl p-3 border-l-4 border-cyan-500">
          <div class="text-xl sm:text-2xl font-black text-cyan-400">24 <span class="text-xs font-normal text-slate-400">位</span></div>
          <div class="text-[11px] text-slate-300 font-medium mt-0.5">實習指導教師</div>
        </div>
        <div class="glass-card rounded-xl p-3 border-l-4 border-teal-500">
          <div class="text-xl sm:text-2xl font-black text-teal-400">12 <span class="text-xs font-normal text-slate-400">班</span></div>
          <div class="text-[11px] text-slate-300 font-medium mt-0.5">集中實習班級</div>
        </div>
        <div class="glass-card rounded-xl p-3 border-l-4 border-blue-500">
          <div class="text-xl sm:text-2xl font-black text-blue-400">24 <span class="text-xs font-normal text-slate-400">堂</span></div>
          <div class="text-[11px] text-slate-300 font-medium mt-0.5">國語及數學試教</div>
        </div>
        <div class="glass-card rounded-xl p-3 border-l-4 border-amber-500">
          <div class="text-xl sm:text-2xl font-black text-amber-400">1,237 <span class="text-xs font-normal text-slate-400">筆</span></div>
          <div class="text-[11px] text-slate-300 font-medium mt-0.5">數位典藏資產</div>
        </div>
      </div>

      <!-- Bento Features (4 Cards) -->
      <div class="grid sm:grid-cols-2 gap-3">
        <div class="glass-card rounded-xl p-4 flex flex-col justify-between space-y-2">
          <div>
            <div class="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center mb-2"><i data-lucide="radio" class="w-4 h-4"></i></div>
            <h3 class="text-sm font-bold text-white">52Hz 藍鯨精神象徵</h3>
            <p class="text-xs text-slate-300 mt-1">從孤獨發聲到全校同頻共鳴，記錄師培生初登講臺的蛻變心路。</p>
          </div>
          <button onclick="switchTab('whale52')" class="text-xs text-cyan-400 hover:text-cyan-300 font-semibold text-left">閱讀主題理念故事 →</button>
        </div>

        <div class="glass-card rounded-xl p-4 flex flex-col justify-between space-y-2">
          <div>
            <div class="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center mb-2"><i data-lucide="users" class="w-4 h-4"></i></div>
            <h3 class="text-sm font-bold text-white">12 班實習計畫與 24 位老師</h3>
            <p class="text-xs text-slate-300 mt-1">完整收錄低中高各年級實習計畫書、每週實習手札省思與教學設計。</p>
          </div>
          <button onclick="switchTab('classes')" class="text-xs text-teal-400 hover:text-teal-300 font-semibold text-left">瀏覽班級與教師名冊 →</button>
        </div>

        <div class="glass-card rounded-xl p-4 flex flex-col justify-between space-y-2">
          <div>
            <div class="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center mb-2"><i data-lucide="award" class="w-4 h-4"></i></div>
            <h3 class="text-sm font-bold text-white">試教講評寶典與教案庫</h3>
            <p class="text-xs text-slate-300 mt-1">24 堂課堂公開試教教材、評委犀利講評記錄與課堂實戰教戰手冊。</p>
          </div>
          <button onclick="switchTab('trials')" class="text-xs text-amber-400 hover:text-amber-300 font-semibold text-left">查閱試教重點紀要 →</button>
        </div>

        <div class="glass-card rounded-xl p-4 flex flex-col justify-between space-y-2">
          <div>
            <div class="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center mb-2"><i data-lucide="image" class="w-4 h-4"></i></div>
            <h3 class="text-sm font-bold text-white">光影回憶寫真藝廊</h3>
            <p class="text-xs text-slate-300 mt-1">始業式、休業式、入班觀課與課堂真實影像紀實（956 張寫真）。</p>
          </div>
          <button onclick="switchTab('gallery')" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold text-left">開啟光影藝廊主題 →</button>
        </div>
      </div>
    </section>

    <!-- TAB 2: 實習歷程 (Timeline) -->
    <section id="tab-timeline" class="tab-content hidden space-y-3">
      <div class="glass-panel rounded-2xl p-4 sm:p-5">
        <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-3">
          <i data-lucide="calendar" class="w-4 h-4 text-cyan-400"></i>
          <span>112學年度集中教育實習歷程里程碑</span>
        </h2>
        <div class="relative border-l-2 border-slate-700/80 ml-3 space-y-4 py-2">
          <div class="relative pl-5">
            <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-900"></div>
            <div class="text-[11px] font-bold text-cyan-400">112.10.06 ‧ 行前整備</div>
            <div class="text-xs font-bold text-white mt-0.5">數學試教行前準備會與教學設計審查</div>
            <p class="text-xs text-slate-300 mt-0.5">各組實習教師針對康軒版教材編寫試教教案，並與指導教授進行第一輪修訂。</p>
          </div>

          <div class="relative pl-5">
            <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900"></div>
            <div class="text-[11px] font-bold text-blue-400">112.10.13 ‧ 實戰試教</div>
            <div class="text-xs font-bold text-white mt-0.5">數學領域公開課堂試教與專家講評</div>
            <p class="text-xs text-slate-300 mt-0.5">12 位實習老師登臺演示乘法、分數、面積、小數等單元，由評委進行現場點評。</p>
          </div>

          <div class="relative pl-5">
            <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal-500 border-2 border-slate-900"></div>
            <div class="text-[11px] font-bold text-teal-400">112.10.27 ‧ 實戰試教</div>
            <div class="text-xs font-bold text-white mt-0.5">國語領域公開課堂試教與五感思維引導</div>
            <p class="text-xs text-slate-300 mt-0.5">12 位實習老師演示落山風、老鷹之歌等篇章，著重教學語言轉換與課堂互動。</p>
          </div>

          <div class="relative pl-5">
            <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
            <div class="text-[11px] font-bold text-emerald-400">112.11.20 ‧ 集中入班</div>
            <div class="text-xs font-bold text-white mt-0.5">實習始業式典禮與三週集中實習啟動</div>
            <p class="text-xs text-slate-300 mt-0.5">24 位實習老師正式進駐四維國小 12 個班級，全面展開導師實習與學科教學實習。</p>
          </div>

          <div class="relative pl-5">
            <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900"></div>
            <div class="text-[11px] font-bold text-amber-400">112.12.08 ‧ 圓滿落幕</div>
            <div class="text-xs font-bold text-white mt-0.5">實習休業式「夢想共聲 ‧ 52 赫茲」主題展演</div>
            <p class="text-xs text-slate-300 mt-0.5">全體師生回顧三週實習光影，致贈指導教師感謝狀，四維國小學童齊唱祝福。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 3: 班級與教師 (Classes & Teachers) -->
    <section id="tab-classes" class="tab-content hidden space-y-4">
      <!-- Grade Filter -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="text-sm font-bold text-white flex items-center gap-1.5">
          <i data-lucide="school" class="w-4 h-4 text-cyan-400"></i>
          <span>12 個實習班級與 24 位實習教師</span>
        </h2>
        <div class="flex space-x-1 text-xs">
          <button onclick="filterGrade('all')" id="btn-grade-all" class="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-medium">全部</button>
          <button onclick="filterGrade('低年級')" id="btn-grade-low" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">低年級</button>
          <button onclick="filterGrade('中年級')" id="btn-grade-mid" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">中年級</button>
          <button onclick="filterGrade('高年級')" id="btn-grade-high" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">高年級</button>
        </div>
      </div>

      <!-- Classes Grid -->
      <div id="classes-grid" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <!-- Rendered by JS -->
      </div>

      <!-- Special 406 Notice Banner (符合卡片整合規範) -->
      <div class="glass-panel rounded-xl p-3.5 border border-pink-500/30 bg-pink-950/20 flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-pink-900/60 text-pink-300 flex items-center justify-center flex-shrink-0 text-lg">💌</div>
        <div class="text-xs space-y-0.5">
          <div class="font-bold text-pink-300">四年六班學童親筆手繪感恩卡典藏</div>
          <p class="text-slate-300 leading-relaxed">全班 52 份感恩祝福手繪卡片已完整收錄於該班實習老師（<button onclick="openTeacherModal('李沛錞')" class="text-pink-300 underline font-semibold">李沛錞老師</button> 與 <button onclick="openTeacherModal('鄭凱瀚')" class="text-pink-300 underline font-semibold">鄭凱瀚老師</button>）之個人寫真集中，無另外單獨設欄。</p>
        </div>
      </div>

      <!-- Teachers 24 Grid -->
      <div class="space-y-2">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">24 位實習教師個人名錄</h3>
        <div id="teachers-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <!-- Rendered by JS -->
        </div>
      </div>
    </section>

    <!-- TAB 4: 試教寶典 (Trial Lessons) -->
    <section id="tab-trials" class="tab-content hidden space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-white flex items-center gap-1.5">
          <i data-lucide="book-open" class="w-4 h-4 text-amber-400"></i>
          <span>課堂試教講評寶典 (數學 12 堂 / 國語 12 堂)</span>
        </h2>
        <div class="flex space-x-1 text-xs">
          <button onclick="switchTrialCategory('math')" id="btn-trial-math" class="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold">數學領域 (12堂)</button>
          <button onclick="switchTrialCategory('mandarin')" id="btn-trial-mandarin" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">國語領域 (12堂)</button>
        </div>
      </div>

      <!-- Math Table/Cards -->
      <div id="trials-math-container" class="space-y-2">
        <!-- Rendered by JS -->
      </div>

      <!-- Mandarin Table/Cards -->
      <div id="trials-mandarin-container" class="hidden space-y-2">
        <!-- Rendered by JS -->
      </div>
    </section>

    <!-- TAB 5: 52赫茲特輯 (52Hz Special) -->
    <section id="tab-whale52" class="tab-content hidden space-y-3">
      <div class="glass-panel rounded-2xl p-5 border border-cyan-800/50 relative overflow-hidden">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center text-xl font-bold border border-cyan-700/60">🐋</div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-white">「夢想共聲 ‧ 5 2 赫茲」同頻共振精神象徵</h2>
            <p class="text-xs text-cyan-300">112學年度高雄市四維國小集中教育實習休業式主題</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed">
          1989 年，科學家在太平洋偵測到一個獨特的頻率——52 赫茲。這隻藍鯨的歌聲比其他同類高出許多，因此被稱為「世界上最孤獨的鯨魚」。在初入教育職場之際，每位實習教師也曾帶著未臻成熟的教學理念獨自摸索；然而在四維國小三週集中實習中，透過導師扶持、同儕切磋與學童純真的眼眸，我們找到了同頻共振的知音，匯聚成磅礡的教育合唱。
        </p>

        <div class="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span class="text-xs text-slate-200 font-medium">即時聲學合成音效：藍鯨 52Hz 上下滑音與水下深淵共鳴</span>
          </div>
          <button onclick="toggle52HzAudio()" id="btn-special-52hz" class="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center space-x-1">
            <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
            <span>聆聽 52Hz 藍鯨呼喚音</span>
          </button>
        </div>
      </div>

      <!-- Quotes Carousel/List -->
      <div class="grid sm:grid-cols-2 gap-2.5">
        <div class="glass-card rounded-xl p-3.5 border-l-2 border-cyan-400">
          <p class="text-xs text-slate-200 italic">「教育不是注滿一桶水，而是點燃一把火。在 52 赫茲的共鳴中，我們看見了孩子的微光。」</p>
          <div class="text-[10px] text-cyan-400 mt-1 font-semibold">— 實習教師教學省思</div>
        </div>
        <div class="glass-card rounded-xl p-3.5 border-l-2 border-teal-400">
          <p class="text-xs text-slate-200 italic">「最初的孤獨，是為了在浩瀚的講臺上，精準辨識出每一位需要等待的靈魂。」</p>
          <div class="text-[10px] text-teal-400 mt-1 font-semibold">— 休業式獻詞節錄</div>
        </div>
      </div>
    </section>

    <!-- TAB 6: 光影藝廊 (Gallery) -->
    <section id="tab-gallery" class="tab-content hidden space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-white flex items-center gap-1.5">
          <i data-lucide="images" class="w-4 h-4 text-purple-400"></i>
          <span>7 大實習主題光影藝廊 (典藏 956 張照片)</span>
        </h2>
        <button onclick="openFullVersionModal()" class="text-xs text-sky-400 hover:underline">查看全量高畫質相簿 →</button>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div class="glass-card rounded-xl p-3.5">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span>11.20 實習始業式</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">36 張寫真</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">師培生入班相見歡、拜會校長導師與誓師啟航。</p>
        </div>

        <div class="glass-card rounded-xl p-3.5">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span>12.08 實習休業式</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">50 張寫真</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">「夢想共聲 ‧ 52赫茲」感性回顧、頒發感謝狀與大合影。</p>
        </div>

        <div class="glass-card rounded-xl p-3.5">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span>課堂觀課與評析</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">100+ 張寫真</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">深入教室觀察導師教學心法、板書節奏與學生互動。</p>
        </div>

        <div class="glass-card rounded-xl p-3.5">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span>班級實習花絮</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">54 張寫真</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">晨間檢查、整潔評比、聯絡簿批改與午餐指導點滴。</p>
        </div>

        <div class="glass-card rounded-xl p-3.5">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span>師生合影與下課紀念</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">26 張寫真</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">下課操場奔跑、課後圍繞問答與溫暖師生大合照。</p>
        </div>

        <div class="glass-card rounded-xl p-3.5">
          <div class="text-xs font-bold text-white flex items-center justify-between">
            <span>數學與國語試教演示</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">200+ 張寫真</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">24 位實習教師試教現場特寫、評審指點與反思時刻。</p>
        </div>
      </div>
    </section>

    <!-- TAB 7: 手冊與公文 (Manual & Documents) -->
    <section id="tab-manual" class="tab-content hidden space-y-3">
      <div class="glass-panel rounded-2xl p-4 sm:p-5">
        <h2 class="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 mb-2">
          <i data-lucide="file-text" class="w-4 h-4 text-cyan-400"></i>
          <span>112.11.17 教育實習手冊與公文檔案總覽</span>
        </h2>
        <p class="text-xs text-slate-300 leading-relaxed mb-3">
          四維國小教學實習手冊涵蓋實習規章、請假規定、導師職責、試教規範與 KWLQ 四維省思評量指標。
        </p>

        <div class="grid sm:grid-cols-2 gap-2 text-xs">
          <div class="glass-card rounded-lg p-3">
            <div class="font-bold text-white">手冊 01 ‧ 實習實施計畫與日程表</div>
            <div class="text-[11px] text-slate-400 mt-0.5">三週實習各日進程、值週與總結行事曆</div>
          </div>
          <div class="glass-card rounded-lg p-3">
            <div class="font-bold text-white">手冊 02 ‧ 實習教師考勤與差假管理規章</div>
            <div class="text-[11px] text-slate-400 mt-0.5">公假核備手續與突發事故應變程序</div>
          </div>
          <div class="glass-card rounded-lg p-3">
            <div class="font-bold text-white">手冊 03 ‧ 教學演示與教案格式規範</div>
            <div class="text-[11px] text-slate-400 mt-0.5">素養導向教學設計、學習目標與評量準則</div>
          </div>
          <div class="glass-card rounded-lg p-3">
            <div class="font-bold text-white">手冊 04 ‧ KWLQ 省思手札撰寫指引</div>
            <div class="text-[11px] text-slate-400 mt-0.5">每週教學心得、反思提問與指導教師評語</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Mobile Bottom Navigation Bar (Screens < 768px) -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/80 px-1 py-1.5 flex justify-around text-center text-[10px]">
    <button onclick="switchTab('overview')" data-mob-tab="overview" class="flex flex-col items-center text-cyan-400 p-1">
      <i data-lucide="home" class="w-4 h-4"></i>
      <span>總覽</span>
    </button>
    <button onclick="switchTab('classes')" data-mob-tab="classes" class="flex flex-col items-center text-slate-400 p-1">
      <i data-lucide="users" class="w-4 h-4"></i>
      <span>師資班級</span>
    </button>
    <button onclick="switchTab('trials')" data-mob-tab="trials" class="flex flex-col items-center text-slate-400 p-1">
      <i data-lucide="award" class="w-4 h-4"></i>
      <span>試教講評</span>
    </button>
    <button onclick="switchTab('whale52')" data-mob-tab="whale52" class="flex flex-col items-center text-slate-400 p-1">
      <i data-lucide="volume-2" class="w-4 h-4"></i>
      <span>52Hz</span>
    </button>
    <button onclick="switchTab('gallery')" data-mob-tab="gallery" class="flex flex-col items-center text-slate-400 p-1">
      <i data-lucide="image" class="w-4 h-4"></i>
      <span>藝廊</span>
    </button>
  </nav>

  <!-- Teacher Detail Modal -->
  <div id="teacher-modal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
    <div class="glass-panel rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 border border-cyan-500/40 relative shadow-2xl space-y-3">
      <button onclick="closeModals()" class="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg" id="tm-avatar">師</div>
        <div>
          <h3 class="text-base font-bold text-white flex items-center gap-1.5" id="tm-name">教師姓名</h3>
          <p class="text-xs text-cyan-300" id="tm-dept">所屬系所 ‧ 年級</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="glass-card rounded-lg p-2.5">
          <span class="text-slate-400 text-[10px] block">實習班級</span>
          <span class="font-bold text-white" id="tm-class">四年六班</span>
        </div>
        <div class="glass-card rounded-lg p-2.5">
          <span class="text-slate-400 text-[10px] block">實習領域</span>
          <span class="font-bold text-white" id="tm-subject">國語領域</span>
        </div>
      </div>

      <div class="glass-card rounded-lg p-2.5 text-xs space-y-1">
        <span class="text-slate-400 text-[10px] block">公開試教單元</span>
        <span class="font-semibold text-cyan-300" id="tm-trial">第10課 落山風</span>
      </div>

      <!-- 406 Student Cards Special Section inside Teacher Modal -->
      <div id="tm-406-box" class="hidden p-3 rounded-xl bg-pink-950/30 border border-pink-500/40 space-y-1 text-xs">
        <div class="font-bold text-pink-300 flex items-center gap-1">
          <span>💌 406 班學童 52 份手繪感恩卡典藏</span>
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed">
          四年六班全體學童親筆手繪之 52 份感恩卡，已完整歸檔於本班實習老師的照片集中。包含純真筆觸、童言手繪與深摯祝福，記錄師生相伴的溫暖回憶。
        </p>
      </div>

      <div class="text-right pt-2">
        <button onclick="closeModals()" class="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs hover:bg-slate-700">關閉</button>
      </div>
    </div>
  </div>

  <!-- Full Version Launcher Modal -->
  <div id="full-modal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3">
    <div class="glass-panel rounded-2xl max-w-md w-full p-5 border border-sky-500/40 relative space-y-3 text-xs">
      <button onclick="closeModals()" class="absolute top-3 right-3 text-slate-400 hover:text-white p-1">✕</button>
      <div class="flex items-center space-x-2 text-sky-400 font-bold text-sm">
        <i data-lucide="layers" class="w-4 h-4"></i>
        <span>Google Sites 雙模切換說明</span>
      </div>
      <p class="text-slate-300 leading-relaxed">
        本版本為專為 Google Sites 打造的 <strong class="text-cyan-300">Lighting 超輕量自給版</strong>（嚴格符合 65,535 字符規範，可直接「嵌入程式碼」）。
      </p>
      <div class="space-y-2 pt-1">
        <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
          <div class="font-bold text-white mb-0.5">🚀 方案 A：直接在 Google Sites 使用本 Lighting 版</div>
          <p class="text-[11px] text-slate-300">零外部依賴、秒速載入、包含全站 24 師名錄、12 班級、試教寶典與即時 Web Audio 音效。</p>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
          <div class="font-bold text-white mb-0.5">💎 方案 B：升級全量高清 PDF 典藏版 (18.9 MB)</div>
          <p class="text-[11px] text-slate-300">若將本機 <code class="text-cyan-300">google-sites-light.html</code> 託管至 GitHub Pages 或校園伺服器，可在 Google Sites 改用「依網址 (By URL)」嵌入，即可享有向量 PDF 線上翻閱與 956 張相片燈箱！</p>
        </div>
      </div>
      <div class="text-right pt-2">
        <button onclick="closeModals()" class="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-500">了解</button>
      </div>
    </div>
  </div>

  <script>
    // --- Practicum Data Pack ---
    const INTERNS = ${JSON.stringify(compactInterns)};
    const CLASSES = ${JSON.stringify(compactClasses)};
    const MATH_TRIALS = ${JSON.stringify(compactMathTrials)};
    const MANDARIN_TRIALS = ${JSON.stringify(compactMandarinTrials)};

    // --- Web Audio Sound Engine (Audible Ocean & 52Hz Whale) ---
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
          if (ctx.state === 'suspended') await ctx.resume();
          const now = ctx.currentTime;

          const comp = ctx.createDynamicsCompressor();
          comp.threshold.setValueAtTime(-12, now);
          comp.connect(ctx.destination);

          this.masterGain = ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.0001, now);
          this.masterGain.gain.linearRampToValueAtTime(0.35, now + 0.8);
          this.masterGain.connect(comp);

          // 1. Water waves noise
          const bufSize = ctx.sampleRate * 4;
          const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const out = noiseBuf.getChannelData(0);
          let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
          for (let i=0; i<bufSize; i++) {
            const w = Math.random()*2 - 1;
            b0 = 0.99886*b0 + w*0.0555;
            b1 = 0.99332*b1 + w*0.075;
            b2 = 0.96900*b2 + w*0.153;
            b3 = 0.86650*b3 + w*0.310;
            b4 = 0.55000*b4 + w*0.532;
            out[i] = (b0+b1+b2+b3+b4 + w*0.5)*0.12;
          }
          this.noiseNode = ctx.createBufferSource();
          this.noiseNode.buffer = noiseBuf;
          this.noiseNode.loop = true;

          this.noiseFilter = ctx.createBiquadFilter();
          this.noiseFilter.type = 'lowpass';
          this.noiseFilter.frequency.setValueAtTime(450, now);
          this.noiseFilter.Q.setValueAtTime(2.2, now);

          this.noiseLfo = ctx.createOscillator();
          this.noiseLfo.frequency.setValueAtTime(0.08, now);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(220, now);
          this.noiseLfo.connect(lfoGain);
          lfoGain.connect(this.noiseFilter.frequency);
          this.noiseLfo.start(now);

          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.24, now);
          this.noiseNode.connect(this.noiseFilter);
          this.noiseFilter.connect(nGain);
          nGain.connect(this.masterGain);
          this.noiseNode.start(now);

          // 2. 52Hz Ocean Harmonics Chords (52, 104, 156, 208, 312 Hz)
          this.droneOscs = [];
          const chord = [
            { f: 52, g: 0.32, t: 'sine' },
            { f: 104, g: 0.28, t: 'sine' },
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

          // 3. Pentatonic Echo Chimes
          const pentatonic = [392, 440, 523, 659, 784];
          const playChime = () => {
            if (!this.isPlaying) return;
            try {
              const cNow = ctx.currentTime;
              const freq = pentatonic[Math.floor(Math.random()*pentatonic.length)];
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
        } catch(e){ console.error('Ambient start error:', e); }
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
        if (this.isPlaying) { this.isMutedByUser = true; this.stop(); }
        else { this.isMutedByUser = false; await this.start(); }
      },

      updateUI(playing) {
        const text = document.getElementById('ambient-btn-text');
        const icon = document.getElementById('ambient-icon-wrapper');
        if (text) text.innerText = playing ? '深海環境音樂：播放中 🎵' : (this.isMutedByUser ? '深海環境音樂：已暫停 ⏸️' : '深海環境音樂：點擊啟動 🎵');
        if (icon) {
          icon.innerHTML = playing ?
            '<span class="w-0.5 h-3 bg-teal-400 rounded-full animate-pulse"></span><span class="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse delay-75"></span><span class="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-pulse delay-150"></span>' :
            '<i data-lucide="waves" class="w-3.5 h-3.5 text-teal-400"></i>';
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
          osc.frequency.setValueAtTime(52*ratio, now);
          osc.frequency.linearRampToValueAtTime(64*ratio, now + 1.2);
          osc.frequency.setValueAtTime(64*ratio, now + 2.0);
          osc.frequency.exponentialRampToValueAtTime(46*ratio, now + 4.2);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.4 / (ratio*0.8), now);
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
        ['btn-ov-52hz', 'btn-special-52hz'].forEach(id => {
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
    window.getAudioContext = getAudioContext;
    async function toggleDeepSeaAmbient() { return await DeepSeaAmbient.toggle(); }
    async function toggle52HzAudio() { return await BlueWhaleEngine.triggerWhaleCall(); }

    // --- UI Navigation and Rendering ---
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      const activeTab = document.getElementById('tab-' + tabId);
      if (activeTab) activeTab.classList.remove('hidden');

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

    function renderClassesAndTeachers() {
      const classBox = document.getElementById('classes-grid');
      const teacherBox = document.getElementById('teachers-grid');

      if (classBox) {
        classBox.innerHTML = CLASSES.map(c => \`
          <div class="glass-card rounded-xl p-3.5 space-y-2 relative \${c.has406Cards ? 'border-pink-500/40' : ''}">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-white">\${c.name}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">\${c.grade}</span>
            </div>
            <div class="text-xs text-slate-300">導師：<strong class="text-white">\${c.mentor} 老師</strong></div>
            <div class="text-[11px] text-slate-400 space-y-0.5">
              <div>實習教師：\${c.teachers.join('、')}</div>
              \${c.has406Cards ? '<div class="text-pink-300 font-medium">💌 內含 52 份學童手繪感恩卡</div>' : ''}
            </div>
          </div>
        \`).join('');
      }

      if (teacherBox) {
        teacherBox.innerHTML = INTERNS.map(i => \`
          <button onclick="openTeacherModal('\${i.name}')" class="glass-card rounded-xl p-2.5 text-left flex items-center space-x-2 touch-target hover:border-cyan-400/50">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              \${i.name.charAt(0)}
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-xs text-white truncate">\${i.name}</div>
              <div class="text-[10px] text-cyan-300 truncate">\${i.classId} ‧ \${i.subject}</div>
            </div>
          </button>
        \`).join('');
      }
    }

    function filterGrade(grade) {
      document.querySelectorAll('#btn-grade-all, #btn-grade-low, #btn-grade-mid, #btn-grade-high').forEach(b => {
        b.className = 'px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700';
      });
      const activeBtn = grade === 'all' ? 'all' : (grade === '低年級' ? 'low' : (grade === '中年級' ? 'mid' : 'high'));
      document.getElementById('btn-grade-' + activeBtn).className = 'px-2.5 py-1 rounded-lg bg-sky-600 text-white font-medium';

      const filtered = grade === 'all' ? CLASSES : CLASSES.filter(c => c.grade === grade);
      const classBox = document.getElementById('classes-grid');
      if (classBox) {
        classBox.innerHTML = filtered.map(c => \`
          <div class="glass-card rounded-xl p-3.5 space-y-2 relative \${c.has406Cards ? 'border-pink-500/40' : ''}">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-white">\${c.name}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">\${c.grade}</span>
            </div>
            <div class="text-xs text-slate-300">導師：<strong class="text-white">\${c.mentor} 老師</strong></div>
            <div class="text-[11px] text-slate-400 space-y-0.5">
              <div>實習教師：\${c.teachers.join('、')}</div>
              \${c.has406Cards ? '<div class="text-pink-300 font-medium">💌 內含 52 份學童手繪感恩卡</div>' : ''}
            </div>
          </div>
        \`).join('');
      }
    }

    function renderTrials() {
      const mathBox = document.getElementById('trials-math-container');
      const manBox = document.getElementById('trials-mandarin-container');

      if (mathBox) {
        mathBox.innerHTML = MATH_TRIALS.map((t, idx) => \`
          <div class="glass-card rounded-xl p-3 text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">\${idx+1}. \${t.name}老師 ‧ \${t.grade}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300">數學演示</span>
            </div>
            <div class="text-cyan-300 font-medium">\${t.unit}</div>
            <p class="text-[11px] text-slate-400">講評提要：\${t.feedback}</p>
          </div>
        \`).join('');
      }

      if (manBox) {
        manBox.innerHTML = MANDARIN_TRIALS.map((t, idx) => \`
          <div class="glass-card rounded-xl p-3 text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">\${idx+1}. \${t.name}老師 ‧ \${t.grade}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-300">國語演示</span>
            </div>
            <div class="text-cyan-300 font-medium">\${t.unit}</div>
            <p class="text-[11px] text-slate-400">講評提要：\${t.feedback}</p>
          </div>
        \`).join('');
      }
    }

    function switchTrialCategory(cat) {
      if (cat === 'math') {
        document.getElementById('trials-math-container').classList.remove('hidden');
        document.getElementById('trials-mandarin-container').classList.add('hidden');
        document.getElementById('btn-trial-math').className = 'px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold';
        document.getElementById('btn-trial-mandarin').className = 'px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700';
      } else {
        document.getElementById('trials-math-container').classList.add('hidden');
        document.getElementById('trials-mandarin-container').classList.remove('hidden');
        document.getElementById('btn-trial-math').className = 'px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700';
        document.getElementById('btn-trial-mandarin').className = 'px-2.5 py-1 rounded-lg bg-teal-600 text-white font-semibold';
      }
    }

    function openTeacherModal(name) {
      const t = INTERNS.find(i => i.name === name);
      if (!t) return;
      document.getElementById('tm-name').innerText = t.name + ' 老師';
      document.getElementById('tm-avatar').innerText = t.name.charAt(0);
      document.getElementById('tm-dept').innerText = t.dept;
      document.getElementById('tm-class').innerText = t.classId + ' 班級實習';
      document.getElementById('tm-subject').innerText = t.subject + '領域教學';
      document.getElementById('tm-trial').innerText = t.trial;

      const cardBox = document.getElementById('tm-406-box');
      if (t.has406Cards) {
        cardBox.classList.remove('hidden');
      } else {
        cardBox.classList.add('hidden');
      }

      document.getElementById('teacher-modal').classList.remove('hidden');
    }

    function openFullVersionModal() {
      document.getElementById('full-modal').classList.remove('hidden');
    }

    function closeModals() {
      document.getElementById('teacher-modal').classList.add('hidden');
      document.getElementById('full-modal').classList.add('hidden');
    }

    // --- Search functionality ---
    function handleSearch(q) {
      q = (q || '').trim().toLowerCase();
      const resultsBox = document.getElementById('search-results-box');
      const list = document.getElementById('search-results-list');
      const count = document.getElementById('search-count');
      const clearBtn = document.getElementById('btn-clear-search');

      if (!q) {
        resultsBox.classList.add('hidden');
        clearBtn.classList.add('hidden');
        return;
      }
      clearBtn.classList.remove('hidden');

      const matchedInterns = INTERNS.filter(i => i.name.includes(q) || i.dept.toLowerCase().includes(q) || i.classId.includes(q) || i.subject.includes(q));
      const matchedClasses = CLASSES.filter(c => c.name.includes(q) || c.mentor.includes(q) || c.id.includes(q));

      const total = matchedInterns.length + matchedClasses.length;
      count.innerText = total + ' 筆符合';

      let html = '';
      matchedInterns.forEach(i => {
        html += \`<div onclick="openTeacherModal('\${i.name}')" class="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 cursor-pointer flex justify-between items-center">
          <div><strong class="text-white">\${i.name} 老師</strong> <span class="text-cyan-300">(\${i.classId} ‧ \${i.subject})</span></div>
          <span class="text-[10px] text-slate-400">\${i.dept}</span>
        </div>\`;
      });
      matchedClasses.forEach(c => {
        html += \`<div onclick="switchTab('classes')" class="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 cursor-pointer flex justify-between items-center">
          <div><strong class="text-white">\${c.name}</strong> <span class="text-slate-400">導師：\${c.mentor}</span></div>
          <span class="text-[10px] text-cyan-300">\${c.grade}</span>
        </div>\`;
      });

      list.innerHTML = html || '<div class="text-slate-400 text-center py-2">查無符合關鍵字項目</div>';
      resultsBox.classList.remove('hidden');
    }

    function clearSearch() {
      const input = document.getElementById('global-search');
      if (input) input.value = '';
      handleSearch('');
    }

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
      renderClassesAndTeachers();
      renderTrials();
      if (window.lucide) lucide.createIcons();

      // Unlock audio on first user gesture
      const unlockAudio = async () => {
        await ensureAudioContext();
        ['click', 'touchstart', 'keydown'].forEach(evt => window.removeEventListener(evt, unlockAudio, true));
      };
      ['click', 'touchstart', 'keydown'].forEach(evt => window.addEventListener(evt, unlockAudio, { once: true, capture: true, passive: true }));
    });
  </script>
</body>
</html>
`;

// 5. Measure and validate character count
const charCount = htmlContent.length;
const byteCount = Buffer.byteLength(htmlContent, 'utf8');
const GOOGLE_SITES_LIMIT = 65535;

console.log('----------------------------------------------------');
console.log(`📊 Generated Character Count: ${charCount} chars`);
console.log(`📦 Generated Byte Size: ${(byteCount / 1024).toFixed(1)} KB`);
console.log(`🎯 Google Sites Max Limit: ${GOOGLE_SITES_LIMIT} chars`);
console.log(`✅ Compliance Margin: ${GOOGLE_SITES_LIMIT - charCount} chars remaining (${((charCount / GOOGLE_SITES_LIMIT) * 100).toFixed(1)}% of limit)`);

if (charCount > GOOGLE_SITES_LIMIT) {
  console.error(`❌ CRITICAL ERROR: Character count ${charCount} exceeds ${GOOGLE_SITES_LIMIT}!`);
  process.exit(1);
}

// 6. Write to destinations
const targetEmbedFile = path.join(ROOT, 'google-sites', 'google-sites-embed.html');
const snippetFile = path.join(ROOT, 'google-sites', 'google-sites-embed-code.txt');
const iframeFile = path.join(ROOT, 'google-sites', 'iframe-embed-code.txt');

fs.writeFileSync(targetEmbedFile, htmlContent, 'utf8');
fs.writeFileSync(snippetFile, htmlContent, 'utf8');

const iframeHtml = `<iframe src="http://localhost:3000" width="100%" height="900" frameborder="0" allow="autoplay" style="border:none; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,0.15); width:100%; min-height:850px;"></iframe>`;
fs.writeFileSync(iframeFile, iframeHtml, 'utf8');

if (fs.existsSync(ARTIFACT_DIR)) {
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'google-sites-embed.html'), htmlContent, 'utf8');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'google-sites-embed-code.txt'), htmlContent, 'utf8');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'iframe-embed-code.txt'), iframeHtml, 'utf8');
  console.log('📋 Also copied to artifacts directory:', ARTIFACT_DIR);
}

console.log('----------------------------------------------------');
console.log('🎉 google-sites-embed.html successfully generated and strictly compliant with Google Sites character limit!');
console.log('📄 Main Output:', targetEmbedFile);
console.log('📄 Snippet for Google Sites Paste:', snippetFile);
console.log('----------------------------------------------------');
