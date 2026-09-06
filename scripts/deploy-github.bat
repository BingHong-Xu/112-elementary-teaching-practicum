@echo off
chcp 65001 >nul
title 112??????? - GitHub Pages ????
cd /d "%~dp0\.."
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-github.ps1"
pause
