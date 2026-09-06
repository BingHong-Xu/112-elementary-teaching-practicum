# 112學年度小教教學實習成果展 ｜ Google Sites「依網址 (By URL)」嵌入與 GitHub Pages 託管完整指引

本指引說明如何將成果展專案託管至 **GitHub Pages**，並於 **Google Sites** 使用**「依網址 (By URL)」**方式嵌入，徹底突破傳統嵌入程式碼 65,535 字符限制，享受 **100% 完整 956 張超高清寫真** 與 **向量 PDF 線上高精度翻閱**！

---

## 🌟 為什麼改用「依網址 (By URL)」嵌入？

| 比較項目 | 舊版：嵌入程式碼 (Embed Code) | 全新：GitHub Pages 依網址嵌入 (By URL) |
| :--- | :---: | :---: |
| **字符長度限制** | 嚴格受限 65,535 字符（約 64 KB） | **零限制（直接讀取 CDN 雲端完整資源）** |
| **向量 PDF 線上翻閱** | ❌ 無法收錄二進位 PDF，需點擊外連 | **✅ 內建 PDF.js 畫布渲染，線上逐頁翻閱、跳頁、縮放** |
| **相片品質與數量** | 僅能放入極度壓縮低清微縮圖或外連 | **✅ 完整收錄 956 張 1280px 超清 WebP，毫髮畢現** |
| **406 感恩卡真跡** | 容易被裁切截斷或遺漏 | **✅ 52 份學童親筆手繪卡片原尺寸 3:4 縱向展開** |
| **深海 52Hz Web Audio** | 受限或無聲 | **✅ 完整 52Hz 藍鯨聲學與雙二階潮汐音效** |
| **載入效能與穩定度** | 大檔容易造成瀏覽器崩潰或記憶體溢出 | **✅ 按需非同步串流載入，60 FPS 流暢度** |

---

## 🚀 第一步：將專案發布至 GitHub Pages

專案目錄中已為您配置好一鍵部署工具：
C:\Users\user\.gemini\antigravity\scratch\112-elementary-teaching-practicum-v2

### 方式一：一鍵批次檔自動部署（最推薦）
1. 在檔案總管中開啟 scripts 資料夾。
2. 雙擊執行 deploy-github.bat。
3. 依照視窗提示：
   - 若已登入 GitHub CLI，會自動建立公開儲存庫並推送至 main 分支。
   - 若尚未登入，可選擇輸入 1 進行 GitHub 網頁授權，或輸入 2 貼上現有 GitHub 倉庫網址。

### 方式二：手動 Git 指令推送
若您習慣使用指令，在專案目錄開啟終端機執行：
`ash
# 1. 建立 GitHub 遠端倉庫（請將 username 換成您的 GitHub 帳號）
git remote add origin https://github.com/username/112-elementary-teaching-practicum.git

# 2. 推送至 main 分支
git branch -M main
git push -u origin main
`

---

## ⚙️ 第二步：在 GitHub 啟用 GitHub Pages 服務

1. 開啟您的 GitHub 倉庫頁面（例如 https://github.com/username/112-elementary-teaching-practicum）。
2. 點擊頂部選單的 **「Settings」 (設定)**。
3. 在左側側邊欄點選 **「Pages」**。
4. 在 **「Build and deployment」** 區塊：
   - **Source**：選擇 Deploy from a branch。
   - **Branch**：選擇 main，資料夾保持 / (root)。
   - 點擊 **「Save」** 儲存。
5. 等候約 1~2 分鐘，頁面頂端將顯示綠色勾勾與發布網址：
   https://username.github.io/112-elementary-teaching-practicum/

> [!NOTE]
> 專案根目錄已內建 .nojekyll 與 google-sites-light.html，因此以下兩個網址均可 100% 正常載入：
> - 根目錄網址：https://username.github.io/112-elementary-teaching-practicum/
> - 輕量頁面網址：https://username.github.io/112-elementary-teaching-practicum/google-sites-light.html

---

## 💻 第三步：在 Google Sites 改用「依網址 (By URL)」嵌入

1. 開啟您的 **Google 協作平台 (Google Sites)** 編輯頁面。
2. 在右側工具列點選 **「插入」 (Insert)** $\rightarrow$ **「嵌入」 (Embed)**。
3. 在彈出的視窗中，點選第一個標籤頁 **「依網址」 (By URL)**。
4. 在網址列貼上您的 GitHub Pages 網址：
   `	ext
   https://username.github.io/112-elementary-teaching-practicum/
   `
5. 系統會顯示預覽，請選擇 **「整頁」 (Whole page)**，然後點擊右下角的 **「插入」 (Insert)**。
6. **版面尺寸調整**：
   - 點選剛插入的區塊，按住底部控制把手往下拖曳至合適高度（建議高度設為約 **900px ~ 1100px**，或依頁面需要拖滿）。
   - 將寬度拉滿至兩側邊界，呈現大氣無邊框的沉浸式成果展。
7. 點擊 Google Sites 右上角的 **「發布」 (Publish)**，即大功告成！

---

## 📱 嵌入後成果檢驗清單

- [ ] **向量 PDF 線上翻閱**：點擊任一班級實習計畫書、406 感恩卡冊（52頁）或 52赫茲紀念冊（33頁），彈窗內由 PDF.js 高精度畫布繪製，可自由翻頁（第 1 / 52 頁）、放大縮小與跳頁。
- [ ] **956 幅高清影像**：光影藝廊、教師個人檔案、休業式全景照片全部秒開，直幅感恩卡 100% 原寸呈現無裁切。
- [ ] **雙維度分類過濾**：可依「7 大公文類型」與「4 大尺寸規格（A4、橫幅、直幅、影音）」即時切換。
- [ ] **行動端極致適應**：手機瀏覽 Google Sites 時，自動啟用單手底部導航列與觸控翻頁。
