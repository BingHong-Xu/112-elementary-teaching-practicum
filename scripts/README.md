# 112 小教實習成果展 - 內部維護與檢測工具指南 (Internal Scripts Guide)

本目錄存放專案建置、驗證與部署所需的自動化輔助腳本。

> [!IMPORTANT]
> **重要說明：本目錄下的腳本為「開發端內部維護與全自動驗證工具」，並非網站對外發布的必要組件。**
> 
> * **若您要發布成果展至 Google 協作平台 (Google Sites)**：
>   請直接使用 [`google-sites/google-sites-embed-code.txt`](../google-sites/google-sites-embed-code.txt) 貼入「嵌入 HTML」即可，**無需**上傳本目錄任何 `.js` 或 `.bat` 腳本。
> * **若您要發布至 GitHub Pages 或自建 Web 伺服器**：
>   只需根目錄靜態網頁（[`index.html`](../index.html)、[`app.js`](../app.js)、[`style.css`](../style.css)、`data/`、`assets/`）。

---

## 腳本清單與功能說明

| 腳本名稱 | 格式 | 用途說明 | 雲端上傳建議 |
| :--- | :--- | :--- | :--- |
| **`inspect-and-verify.js`** | Node.js | **全自動真機檢測與多視窗截圖**：啟動本機 HTTP 伺服器並以 Headless Edge 透過 CDP 協議深度驗證 7 大展區、24位實習教師彈窗、406手繪感恩卡數位典藏冊、向量 PDF 閱讀器與手機/平板響應式排版，確認 0 控制台報錯。 | 雲端雲端硬碟若限制 `.js` 檔案上傳，可上傳同目錄的 `inspect-and-verify.js.txt` 或以壓縮檔打包備份。 |
| **`inspect-and-verify.js.txt`** | 純文字 | `inspect-and-verify.js` 的純文字備份副本，專為防止雲端防毒政策攔截 `.js` 腳本而設。 | 100% 雲端安全無阻。 |
| **`deploy-github.bat` / `.ps1`** | Batch/PS1 | GitHub Pages 一鍵部署精靈，自動提交並導引推送至 GitHub 倉庫。 | 本機使用。 |
| **`build-embed.js`** | Node.js | 自動打包產出 Google Sites 專用輕量內嵌代碼（嚴格控制在 65,535 字元上限以內）。 | 開發端建置用。 |

---

## 如何執行全自動真機驗證

在專案根目錄下開啟終端機執行：

```powershell
node scripts/inspect-and-verify.js
```

檢測完成後，所有高畫質檢驗截圖將自動產出於專案的 `test-output/` 資料夾內。
