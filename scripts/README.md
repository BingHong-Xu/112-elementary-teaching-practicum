# 112 小教實習成果展 - 內部維護與檢測工具指南 (Internal Scripts Guide)

本目錄存放專案建置、驗證、部署與雲端打包所需的自動化輔助腳本。

> [!IMPORTANT]
> **重要說明：本目錄下的腳本為「開發端內部維護與全自動驗證工具」，並非網站對外發布的必要組件。**
> 
> * **若您要發布成果展至 Google 協作平台 (Google Sites)**：
>   請直接使用 [`google-sites/google-sites-embed-code.txt`](../google-sites/google-sites-embed-code.txt) 貼入「嵌入 HTML」即可，**無需**上傳本目錄任何 `.js` 或 `.bat` 腳本。
> * **若您要發布至 GitHub Pages 或自建 Web 伺服器**：
>   只需根目錄靜態網頁（[`index.html`](../index.html)、[`app.js`](../app.js)、[`style.css`](../style.css)、`data/`、`assets/`）。
> * **若您要備份整個專案至 Google Drive 或其他雲端硬碟**：
>   可直接執行 `node scripts/create-cloud-bundle.js` 產出 `dist/112-practicum-portfolio-clean.zip`，100% 排除引發雲端防毒安全政策攔截的 `.bat`、`.ps1`、`.git` 與除錯暫存檔案。

---

## 腳本清單與功能說明

| 腳本名稱 | 格式 | 用途說明 | 雲端相容性與上傳建議 |
| :--- | :--- | :--- | :--- |
| **`create-cloud-bundle.js`** | Node.js | **雲端安全純淨打包工具**：使用非獨佔 JSZip 引擎將全站網頁、資料庫、寫真集與 PDF 封裝為 100% 雲端相容的 ZIP 壓縮包，自動排除 `.git`、`.bat`、`test-output/` 等衝突檔案。 | 本機建置用，產出之 ZIP 檔可 100% 安全上傳任何雲端空間。 |
| **`inspect-and-verify.js`** | Node.js | **全自動真機檢測與多視窗截圖**：啟動本機 HTTP 伺服器並以 Headless Edge 透過 CDP 協議深度驗證 7 大展區、24位實習教師彈窗、406手繪感恩卡數位典藏冊、向量 PDF 閱讀器與手機/平板響應式排版，確認 0 控制台報錯。 | 雲端雲端硬碟若限制 `.js` 檔案上傳，可上傳同目錄的 `inspect-and-verify.js.txt`。 |
| **`inspect-and-verify.js.txt`** | 純文字 | `inspect-and-verify.js` 的純文字備份副本，專為防止雲端防毒政策攔截 `.js` 腳本而設。 | 100% 雲端安全無阻。 |
| **`build-embed.js`** | Node.js | 自動打包產出 Google Sites 專用輕量內嵌代碼（嚴格控制在 65,535 字元上限以內）。 | 開發端建置用。 |
| **`deploy-github.bat` / `.txt`** | Batch/純文字 | GitHub Pages 一鍵部署精靈，自動提交並導引推送至 GitHub 倉庫。 | 附有 `.txt` 安全版本供雲端備份。 |
| **`deploy-github.ps1` / `.txt`** | PowerShell/純文字 | GitHub Pages 部署底層腳本。 | 附有 `.txt` 安全版本供雲端備份。 |
| **`inject-dimensions.js`** | Node.js | 自動測量並注入影像寬高規格至資料模組中。 | 開發端建置用。 |
| **`rebuild-files-index.js`** | Node.js | 掃描文獻庫並重新產製全文檢索索引。 | 開發端建置用。 |
| **`rebuild-hd-cache.js`** | Node.js | 重建相簿高畫質影像快取與尺寸比對。 | 開發端建置用。 |
| **`archive/`** | 資料夾 | 收錄歷史階段性開發暫存測試腳本（已全數轉為 `.txt` 安全純文字格式）。 | 安全純文字，零防毒攔截。 |

---

## 常見操作指令

1. **一鍵建置雲端純淨發布包**：
   ```powershell
   node scripts/create-cloud-bundle.js
   ```

2. **全自動真機功能與 0 報錯驗證**：
   ```powershell
   node scripts/inspect-and-verify.js
   ```
