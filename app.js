/**
 * 高師大 x 四維國小 小教教學實習『夢想共聲 ５２赫茲』成果展
 * Main Application Logic V3 (Touch-first & Comprehensive RWD)
 */

let exhibitionData = null;
let currentCeremonyCategory = 'all';
let currentGradeSection = 'all';
let currentExtraTab = 'startCeremony';
let currentPhotoIndex = 0;
let activePhotoList = [];
let quoteIndex = 0;

// Quotes pool extracted from handbooks and presentation decks
const quotesPool = [
  {
    quote: "我是蔡佳芸，正在成為教育「探星者」的路上！星探的工作是在人群找與眾不同的人；而探星是在每一個學生身上找到他與眾不同的亮點。不求每個孩子都成為最耀眼的那顆星，但願他們都在自己的世界裡引以為傲。",
    author: "蔡佳芸 老師",
    dept: "特殊教育學系 ｜ 二年七班"
  },
  {
    quote: "統籌三週實習與休業式雖任重道遠，但在2-10班孩子與孔老師身上，我找回了做教育最純粹的赤子之心。52赫茲不再是孤獨的歌聲，而是我們24人齊聚的合奏！",
    author: "徐秉鴻 實習校長",
    dept: "科學教育暨環境教育研究所 ｜ 二年十班"
  },
  {
    quote: "教室就是最動人的劇場。當我把表演藝術的情境互動融入語文課堂，看見孩子們眼中閃爍的專注目光，我知道我們的心已經在同一條頻率上共振。",
    author: "鄭凱瀚 實習副校長",
    dept: "中山大學劇場藝術學系 ｜ 四年六班"
  },
  {
    quote: "試教時面對孩子千奇百怪的提問，我學會了放下講台上的成見，蹲下身子傾聽孩子的思路。教育不是把水桶倒滿，而是把火種點燃！",
    author: "蔡承軒 老師",
    dept: "教育學系 ｜ 二年十班"
  },
  {
    quote: "親手為全班29位同學寫下專屬小卡，在道別那一刻看見孩子們眼眶的淚光與手寫卡片，這三週的每一分努力都無比值得。",
    author: "易冠蓁 老師",
    dept: "軟體工程研究所 ｜ 六年十班"
  },
  {
    quote: "親手為大家繪下這隻52赫茲深海藍鯨，正如我們在四維國小的相遇。406班每個孩子寫給我的暖心小卡，是我一輩子珍藏的教育禮物。",
    author: "李沛錞 老師",
    dept: "東南亞學系碩士班 ｜ 四年六班"
  },
  {
    quote: "「師生互動不是一問一答，而是要把問題丟給同學，促成同學之間的一問多答。」這份在試教中學到的真功夫，是我三週最珍貴的收穫。",
    author: "羅渝傑 老師",
    dept: "教育學系 ｜ 六年五班"
  },
  {
    quote: "郭威慶老師教我們「棒子與胡蘿蔔的拿捏，黏但不能太黏」。高年級民主自治的班遊規劃海報，讓我看到了孩子們無限的自律與潛能！",
    author: "賴泓均 老師",
    dept: "地理學系 ｜ 五年五班"
  }
];

// Document Ready
document.addEventListener('DOMContentLoaded', async () => {
  checkIframeEmbed();
  initScrollProgress();
  initBackToTop();
  initWaveCanvas();
  initAudioSynthesizer();
  await loadExhibitionData();
  setupNavigation();
  setupEventListeners();
  setupTouchGestures();
  renderQuotesSlider();
});

// Check if embedded in iframe (e.g. Google Sites)
function checkIframeEmbed() {
  try {
    if (window.self !== window.top) {
      document.body.classList.add('in-iframe');
      console.log('Running inside iframe (Google Sites embed mode)');
    }
  } catch (e) {
    document.body.classList.add('in-iframe');
  }
}

// Scroll Progress Bar
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    bar.style.width = scrolled + '%';
  }, { passive: true });
}

// Back to Top Button
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Load Exhibition Data
async function loadExhibitionData() {
  try {
    if (window.EXHIBITION_DATA) {
      exhibitionData = window.EXHIBITION_DATA;
    } else {
      const res = await fetch('exhibition_data.json');
      exhibitionData = await res.json();
    }
    
    renderHeroWhaleCard();
    renderLeadership();
    renderTimeline();
    renderClasses();
    renderCeremonyGallery();
    renderExtraGallery();
  } catch (err) {
    console.error('Failed to load exhibition data:', err);
  }
}

// -------------------------------------------------------------
// Canvas Background Waves & 52Hz Frequency Particles
// -------------------------------------------------------------
function initWaveCanvas() {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  
  // Bioluminescent deep-sea particles
  const particleCount = window.innerWidth < 768 ? 24 : 48;
  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 2.2 + 0.8,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -Math.random() * 0.45 - 0.12,
    alpha: Math.random() * 0.6 + 0.2,
    baseAlpha: Math.random() * 0.5 + 0.2
  }));

  let step = 0;
  function animate() {
    step += 0.016;
    ctx.clearRect(0, 0, width, height);

    // Deep Marine Soundwaves (3 flowing sine bands)
    const waveCount = window.innerWidth < 768 ? 2 : 3;
    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      const waveAlpha = 0.035 + w * 0.022;
      ctx.strokeStyle = `rgba(45, 212, 191, ${waveAlpha})`;
      ctx.lineWidth = 1.6;

      const baseFreq = 0.0018 + w * 0.001;
      const speed = step * (0.7 + w * 0.3);
      const amp = 42 + w * 24;
      const yOffset = height * (0.32 + w * 0.26);

      ctx.moveTo(0, yOffset);
      const stepX = window.innerWidth < 768 ? 24 : 16;
      for (let x = 0; x <= width; x += stepX) {
        const y = Math.sin(x * baseFreq + speed) * amp +
                  Math.cos(x * 0.0012 + speed * 0.4) * (amp * 0.35) + yOffset;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Floating plankton particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = p.baseAlpha + Math.sin(step * 2 + p.x) * 0.2;
      if (p.y < 0) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 212, 191, ${Math.max(0.1, p.alpha)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(45, 212, 191, 0.45)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// -------------------------------------------------------------
// Interactive 52 Hertz Web Audio Synthesizer
// -------------------------------------------------------------
let audioCtx = null;
let isAudioPlaying = false;
let osc52 = null;
let oscHarmonic = null;
let masterGain = null;

function initAudioSynthesizer() {
  const btn = document.getElementById('audio-toggle-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isAudioPlaying) {
      start52HzSound();
      btn.classList.add('playing');
      const textSpan = btn.querySelector('.audio-text');
      if (textSpan) textSpan.textContent = '52Hz 共鳴中';
      isAudioPlaying = true;
    } else {
      stop52HzSound();
      btn.classList.remove('playing');
      const textSpan = btn.querySelector('.audio-text');
      if (textSpan) textSpan.textContent = '聆聽 52Hz 夢想共鳴';
      isAudioPlaying = false;
    }
  });
}

function start52HzSound() {
  if (!audioCtx) return;

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 1.8);
  masterGain.connect(audioCtx.destination);

  // 52 Hz fundamental sine wave
  osc52 = audioCtx.createOscillator();
  osc52.type = 'sine';
  osc52.frequency.setValueAtTime(52, audioCtx.currentTime);

  // 104 Hz 1st overtone for rich warmth
  oscHarmonic = audioCtx.createOscillator();
  oscHarmonic.type = 'sine';
  oscHarmonic.frequency.setValueAtTime(104, audioCtx.currentTime);

  const gainHarmonic = audioCtx.createGain();
  gainHarmonic.gain.setValueAtTime(0.35, audioCtx.currentTime);

  osc52.connect(masterGain);
  oscHarmonic.connect(gainHarmonic);
  gainHarmonic.connect(masterGain);

  osc52.start();
  oscHarmonic.start();
}

function stop52HzSound() {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.0);
    setTimeout(() => {
      try {
        if (osc52) osc52.stop();
        if (oscHarmonic) oscHarmonic.stop();
      } catch (e) {}
    }, 1000);
  }
}

// -------------------------------------------------------------
// Render Hero Whale Card
// -------------------------------------------------------------
function renderHeroWhaleCard() {
  const container = document.getElementById('hero-whale-container');
  if (!container || !exhibitionData) return;

  const whalePhoto = exhibitionData.ceremonyPhotos.find(p => p.file.includes('29_卡片長李沛錞親繪')) || exhibitionData.ceremonyPhotos[28];
  
  container.innerHTML = `
    <div class="whale-featured-card" onclick="openLightboxByPhotoId('ceremony', ${whalePhoto.id})">
      <div class="whale-img-box">
        <img src="assets/images/ceremony/${encodeURIComponent(whalePhoto.file)}" alt="${whalePhoto.title}" loading="eager" />
        <span class="whale-badge">✨ 官方主視覺手繪卡</span>
      </div>
      <div class="whale-info-box">
        <h3>『夢想共聲 ５２赫茲』手繪主視覺</h3>
        <p>卡片長 李沛錞 親繪：在深邃的教育海洋中，每位實習老師如同一隻吟唱 52 赫茲的藍鯨，相遇四維國小，終在教育的浩瀚中找到心靈的共振。</p>
        <div class="whale-footer-meta">
          <span class="whale-artist-tag">🎨 創作者：李沛錞 (東南亞碩三)</span>
          <span class="whale-zoom-hint">🔍 點擊檢視高清大圖</span>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Render Leadership & 8 Divisions Bento Grid
// -------------------------------------------------------------
function renderLeadership() {
  const leadersGrid = document.getElementById('leaders-grid');
  const divisionsGrid = document.getElementById('divisions-grid');
  if (!leadersGrid || !divisionsGrid || !exhibitionData) return;

  // 4 Master Educators
  leadersGrid.innerHTML = exhibitionData.leadership.principalsAndProfessors.map(l => `
    <div class="leader-card">
      <div class="leader-avatar-box">👨‍🏫</div>
      <h3 class="leader-name">${l.name}</h3>
      <div class="leader-title-tag">${l.title}</div>
      <div class="leader-org">${l.org}</div>
      <p class="leader-bio">${l.desc}</p>
    </div>
  `).join('');

  // 8 Working Divisions Bento Grid
  divisionsGrid.innerHTML = exhibitionData.leadership.eightDivisions.map(d => `
    <div class="div-bento-item">
      <div class="div-tag-name">🔹 ${d.name}</div>
      <div class="div-lead-person">主責：${d.lead}</div>
      <div class="div-desc-duty">${d.duty}</div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Render Timeline
// -------------------------------------------------------------
function renderTimeline() {
  const track = document.getElementById('timeline-track');
  if (!track || !exhibitionData) return;

  track.innerHTML = exhibitionData.timeline.map((item) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <span class="timeline-date-tag">${item.date} ｜ ${item.phase}</span>
        <h3>${item.title}</h3>
        <div class="timeline-location">📍 ${item.location}</div>
        <p>${item.desc}</p>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Render Classes & Teachers (Filtered & Searchable)
// -------------------------------------------------------------
function renderClasses() {
  const grid = document.getElementById('classes-grid');
  if (!grid || !exhibitionData) return;

  const searchVal = (document.getElementById('teacher-search')?.value || '').trim().toLowerCase();

  const filtered = exhibitionData.classesData.filter(c => {
    // Grade filter
    if (currentGradeSection !== 'all' && c.gradeSection !== currentGradeSection) {
      return false;
    }
    // Search query filter
    if (searchVal) {
      const matchClass = c.className.toLowerCase().includes(searchVal) || c.classCode.toLowerCase().includes(searchVal);
      const matchMentor = c.mentorTeacher.toLowerCase().includes(searchVal);
      const matchIntern = c.internTeachers.some(i => 
        i.name.toLowerCase().includes(searchVal) ||
        i.department.toLowerCase().includes(searchVal) ||
        i.demoUnit.toLowerCase().includes(searchVal) ||
        i.subject.toLowerCase().includes(searchVal)
      );
      return matchClass || matchMentor || matchIntern;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        <p style="font-size: 1.15rem; color: var(--text-muted); margin-bottom: 1rem;">無符合「${searchVal}」的班級或實習教師資料</p>
        <button class="btn-secondary" onclick="resetSearch()">重設搜尋條件</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(c => `
    <div class="class-card">
      <div class="class-card-top">
        <span class="class-code-badge">${c.classCode} ${c.className}</span>
        <span class="grade-ribbon">${c.gradeSection}組</span>
      </div>

      <div class="mentor-banner">
        <span class="mentor-title">👩‍🏫 輔導導師：${c.mentorTeacher}</span>
        ${c.dialoguePhoto ? `
          <button class="dialogue-preview-btn" onclick="openClassDialogueModal('${c.classCode}')">
            📸 入班合影
          </button>
        ` : ''}
      </div>

      <div class="class-card-body">
        ${c.internTeachers.map(it => `
          <div class="intern-profile-block">
            <div class="intern-name-row">
              <span class="intern-real-name">${it.name}</span>
              <span class="intern-academic-dept">${it.department}</span>
            </div>
            <span class="intern-role-pill">${it.role} ｜ ${it.subject}</span>
            <div class="demo-unit-row">📖 <strong>演示單元：</strong>${it.demoUnit}</div>
            <div class="intern-quote-box">“${it.quote}”</div>
          </div>
        `).join('')}
      </div>

      <div class="class-card-footer">
        💡 <strong>班級特質：</strong>${c.classHighlight}
      </div>
    </div>
  `).join('');
}

function resetSearch() {
  const input = document.getElementById('teacher-search');
  if (input) input.value = '';
  currentGradeSection = 'all';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.grade === 'all'));
  renderClasses();
}

// Open class dialogue photo in lightbox
function openClassDialogueModal(classCode) {
  const targetClass = exhibitionData.classesData.find(c => c.classCode === classCode);
  if (!targetClass || !targetClass.dialoguePhoto) return;

  const item = {
    title: `${targetClass.classCode} ${targetClass.className} 拜訪輔導導師與初入班合影`,
    category: `${targetClass.gradeSection}組入班對話`,
    desc: `【${targetClass.className}】實習輔導教師：${targetClass.mentorTeacher}。實習教師：${targetClass.internTeachers.map(i => i.name).join('、')}。攝於初訪四維國小進行入班對話與撰寫實習計畫之珍貴時刻。`,
    relPath: targetClass.dialoguePhoto
  };

  activePhotoList = [item];
  currentPhotoIndex = 0;
  updateLightboxContent();
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// -------------------------------------------------------------
// Render 33 Official Ceremony Photos Gallery
// -------------------------------------------------------------
function renderCeremonyGallery() {
  const grid = document.getElementById('photo-grid');
  if (!grid || !exhibitionData) return;

  const filtered = exhibitionData.ceremonyPhotos.filter(p => {
    if (currentCeremonyCategory === 'all') return true;
    return p.category === currentCeremonyCategory;
  });

  activePhotoList = filtered;

  grid.innerHTML = filtered.map((p, idx) => `
    <div class="ceremony-photo-card" onclick="openLightboxByIndex(${idx})">
      <div class="photo-thumb-container">
        <img src="assets/images/ceremony/${encodeURIComponent(p.file)}" alt="${p.title}" loading="lazy" />
        <span class="photo-cat-tag">${p.category}</span>
        <div class="photo-zoom-pill">🔍</div>
      </div>
      <div class="photo-info-padding">
        <h4 class="photo-headline">${p.title}</h4>
        <p class="photo-story">${p.desc}</p>
      </div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Render Secondary Photo Archives
// -------------------------------------------------------------
function renderExtraGallery() {
  const grid = document.getElementById('extra-grid');
  if (!grid || !exhibitionData || !exhibitionData.extraGalleries) return;

  const list = exhibitionData.extraGalleries[currentExtraTab] || [];
  
  grid.innerHTML = list.map((item, idx) => `
    <div class="archive-card" onclick="openExtraLightbox('${currentExtraTab}', ${idx})">
      <div class="archive-img-wrap">
        <img src="${item.relPath}" alt="${item.title}" loading="lazy" />
      </div>
      <div class="archive-title-label">${item.title}</div>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// Lightbox Functionality
// -------------------------------------------------------------
function openLightboxByIndex(index) {
  currentPhotoIndex = index;
  updateLightboxContent();
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openLightboxByPhotoId(type, id) {
  const idx = exhibitionData.ceremonyPhotos.findIndex(p => p.id === id);
  if (idx !== -1) {
    activePhotoList = exhibitionData.ceremonyPhotos;
    openLightboxByIndex(idx);
  }
}

function openExtraLightbox(tab, index) {
  const list = exhibitionData.extraGalleries[tab] || [];
  activePhotoList = list.map(item => ({
    title: item.title,
    category: item.category,
    desc: `【${item.category}】實習影像珍藏記錄。點滴淬鍊，見證高師大師資生在四維國小深耕教育、陪伴學童成長的每一刻。`,
    relPath: item.relPath
  }));
  currentPhotoIndex = index;
  updateLightboxContent();
  const modal = document.getElementById('lightbox-modal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateLightboxContent() {
  const item = activePhotoList[currentPhotoIndex];
  if (!item) return;

  const imgSrc = item.relPath || `assets/images/ceremony/${encodeURIComponent(item.file)}`;
  document.getElementById('lightbox-img').src = imgSrc;
  document.getElementById('lightbox-tag').textContent = item.category || '實習紀實';
  document.getElementById('lightbox-title').textContent = item.title;
  document.getElementById('lightbox-desc').textContent = item.desc;
  document.getElementById('lightbox-counter').textContent = `${currentPhotoIndex + 1} / ${activePhotoList.length}`;
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function prevPhoto() {
  if (currentPhotoIndex > 0) {
    currentPhotoIndex--;
  } else {
    currentPhotoIndex = activePhotoList.length - 1;
  }
  updateLightboxContent();
}

function nextPhoto() {
  if (currentPhotoIndex < activePhotoList.length - 1) {
    currentPhotoIndex++;
  } else {
    currentPhotoIndex = 0;
  }
  updateLightboxContent();
}

// -------------------------------------------------------------
// Quotes Carousel Slider & Dots
// -------------------------------------------------------------
function renderQuotesSlider() {
  const q = quotesPool[quoteIndex];
  const slide = document.getElementById('quote-slide-content');
  const dotsContainer = document.getElementById('quote-dots');
  if (!slide) return;

  slide.innerHTML = `
    <div class="quote-giant-mark">“</div>
    <div class="quote-main-content">${q.quote}</div>
    <div class="quote-author-name">${q.author}</div>
    <div class="quote-author-role">${q.dept}</div>
  `;

  if (dotsContainer) {
    dotsContainer.innerHTML = quotesPool.map((_, i) => `
      <div class="quote-dot ${i === quoteIndex ? 'active' : ''}" onclick="goToQuote(${i})" aria-label="切換至第 ${i+1} 則金句"></div>
    `).join('');
  }
}

function goToQuote(idx) {
  quoteIndex = idx;
  renderQuotesSlider();
}

function prevQuote() {
  quoteIndex = (quoteIndex - 1 + quotesPool.length) % quotesPool.length;
  renderQuotesSlider();
}

function nextQuote() {
  quoteIndex = (quoteIndex + 1) % quotesPool.length;
  renderQuotesSlider();
}

// -------------------------------------------------------------
// Touch Swipe Gestures for Mobile & Tablet
// -------------------------------------------------------------
function setupTouchGestures() {
  // Swipe for Lightbox Media
  const lightboxMedia = document.querySelector('.lightbox-media-col');
  if (lightboxMedia) {
    addSwipeListener(lightboxMedia, () => nextPhoto(), () => prevPhoto());
  }

  // Swipe for Quotes Carousel
  const quoteCard = document.getElementById('quote-slide-content');
  if (quoteCard) {
    addSwipeListener(quoteCard, () => nextQuote(), () => prevQuote());
  }
}

function addSwipeListener(element, onSwipeLeft, onSwipeRight) {
  let startX = 0;
  let startY = 0;

  element.addEventListener('touchstart', (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    }
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const endX = e.changedTouches[0].screenX;
      const endY = e.changedTouches[0].screenY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Ensure horizontal swipe is dominant and exceeds 40px
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          onSwipeLeft(); // Swipe Left -> Next
        } else {
          onSwipeRight(); // Swipe Right -> Previous
        }
      }
    }
  }, { passive: true });
}

// -------------------------------------------------------------
// Setup Event Listeners & Navigation
// -------------------------------------------------------------
function setupEventListeners() {
  // Grade Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGradeSection = btn.dataset.grade;
      renderClasses();
    });
  });

  // Search input
  const searchInput = document.getElementById('teacher-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderClasses();
    });
  }

  // Ceremony Category Pills
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCeremonyCategory = pill.dataset.cat;
      renderCeremonyGallery();
    });
  });

  // Extra Gallery Tabs
  document.querySelectorAll('.archive-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.archive-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentExtraTab = btn.dataset.tab;
      renderExtraGallery();
    });
  });

  // Quotes Navigation
  document.getElementById('prev-quote-btn')?.addEventListener('click', prevQuote);
  document.getElementById('next-quote-btn')?.addEventListener('click', nextQuote);

  // Lightbox Close & Navigation
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', prevPhoto);
  document.getElementById('lightbox-next')?.addEventListener('click', nextPhoto);

  document.getElementById('lightbox-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox-modal') closeLightbox();
  });

  // Keyboard navigation for Lightbox
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightbox-modal');
    if (!modal.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') prevPhoto();
    else if (e.key === 'ArrowRight') nextPhoto();
  });

  // Auto rotate quotes every 8 seconds
  setInterval(() => {
    nextQuote();
  }, 8000);
}

function setupNavigation() {
  const mobileBtn = document.getElementById('mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('mobile-open');
      mobileBtn.textContent = isOpen ? '✕' : '☰';
      mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile menu when clicking any link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        mobileBtn.textContent = '☰';
        mobileBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Scroll spy active link
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(sec => {
      const h = sec.offsetHeight;
      const top = sec.offsetTop - 120;
      const id = sec.getAttribute('id');
      const navLink = document.querySelector(`.nav-links a[href="#${id}"]`);

      if (navLink) {
        if (scrollY > top && scrollY <= top + h) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      }
    });
  }, { passive: true });
}
