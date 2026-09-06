# PowerShell Deploy Script for GitHub Pages
param(
    [string]$RepoName = "112-elementary-teaching-practicum",
    [string]$RemoteUrl = ""
)

$ErrorActionPreference = "Stop"
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  112小教實習成果展 GitHub Pages 一鍵部署精靈" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectDir = (Get-Item -Path $PSScriptRoot).Parent.FullName
Set-Location $ProjectDir

# 1. Check Git
Write-Host "[1/4] 檢查 Git 版本控制..." -ForegroundColor Green
if (-not (Test-Path ".git")) {
    Write-Host "初始化 Git 倉庫 (預設 main 分支)..." -ForegroundColor Gray
    git init -b main
} else {
    git branch -M main
}

# 2. Stage and Commit
Write-Host "[2/4] 檢查檔案變更並建立部署版本..." -ForegroundColor Green
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "feat: Deploy 112 practicum portfolio with vector PDF reader and 956 HD photos"
    Write-Host "已建立最新提交。" -ForegroundColor Gray
} else {
    Write-Host "倉庫檔案已是最新，無需額外提交。" -ForegroundColor Gray
}

# 3. Check Remote or GH CLI
Write-Host "[3/4] 檢查 GitHub 連線與遠端倉庫..." -ForegroundColor Green

$existingRemote = (git remote -v) 2>$null
$hasRemote = ($existingRemote -match "origin")

if (-not $hasRemote) {
    if ($RemoteUrl -ne "") {
        git remote add origin $RemoteUrl
        Write-Host "已新增遠端倉庫: $RemoteUrl" -ForegroundColor Gray
    } else {
        # Check gh cli login status
        $ghCheck = (& gh auth status 2>&1)
        if ($LASTEXITCODE -eq 0) {
            Write-Host "檢測到 GitHub CLI 已登入！" -ForegroundColor Green
            $createRepo = Read-Host "是否由 GitHub CLI 自動在您的帳號下建立公開倉庫 '' 並推送？ (Y/N, 預設 Y)"
            if ($createRepo -eq "" -or $createRepo -match "^[Yy]") {
                Write-Host "正在建立 GitHub 遠端倉庫: $RepoName ..." -ForegroundColor Cyan
                gh repo create $RepoName --public --source=. --remote=origin --push
                
                Write-Host "嘗試啟用 GitHub Pages..." -ForegroundColor Cyan
                $currentUser = (gh api user --jq .login)
                try {
                    gh api "repos/$currentUser/$RepoName/pages" -X POST -f "source[branch]=main" -f "source[path]=/" 2>$null
                } catch {
                    # Pages might already exist or need a moment
                }
                
                $pagesUrl = "https://$currentUser.github.io/$RepoName/"
                Write-Host ""
                Write-Host "🎉 恭喜！已成功建立並推送至 GitHub Pages！" -ForegroundColor Green
                Write-Host "網站專屬網址: $pagesUrl" -ForegroundColor Yellow
                Write-Host "Google Sites 嵌入檔案網址: $pagesUrl/google-sites-light.html" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "請在 Google Sites 點擊「插入」->「嵌入」->「依網址 (By URL)」，貼上上述網址即可！" -ForegroundColor White
                exit 0
            }
        }

        Write-Host "請選擇遠端倉庫設定方式：" -ForegroundColor Yellow
        Write-Host "  1. 執行 'gh auth login' 進行 GitHub 授權"
        Write-Host "  2. 手動輸入您已建立的 GitHub 倉庫網址 (例如: https://github.com/your-username/112-practicum.git)"
        Write-Host "  3. 暫不推送，僅在本機保留完整 git 倉庫"
        $choice = Read-Host "請輸入選項 (1/2/3)"

        if ($choice -eq "1") {
            gh auth login
            if ($LASTEXITCODE -eq 0) {
                gh repo create $RepoName --public --source=. --remote=origin --push
                Write-Host "推送完成！" -ForegroundColor Green
            }
        } elseif ($choice -eq "2") {
            $customUrl = Read-Host "請貼上 GitHub 倉庫 URL"
            if ($customUrl) {
                git remote add origin $customUrl.Trim()
                git push -u origin main
                Write-Host "已成功推送至 $customUrl ！" -ForegroundColor Green
            }
        } else {
            Write-Host "本機版本庫已準備完成。您可於稍後手動執行 git push。" -ForegroundColor Gray
            exit 0
        }
    }
} else {
    Write-Host "正在推送至現有遠端倉庫 origin (main 分支)..." -ForegroundColor Cyan
    git push -u origin main
    Write-Host "推送完成！" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  GitHub Pages 設定提醒" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "若尚未啟用 GitHub Pages，請前往該倉庫的：" -ForegroundColor White
Write-Host "Settings -> Pages -> Build and deployment" -ForegroundColor Cyan
Write-Host "  Source: Deploy from a branch" -ForegroundColor White
Write-Host "  Branch: main / (root)" -ForegroundColor White
Write-Host "儲存約 1~2 分鐘後，即可在 Google Sites 依網址完整嵌入！" -ForegroundColor Green
