@echo off
chcp 65001 >nul
title Model Finder - Import
cd /d "%~dp0backend"
echo Telegram eksportidan modellar bazaga import qilinmoqda...
echo Oldin import qilinganlar o'tkazib yuboriladi, to'xtab qolsa qayta ishga tushiring.
echo.
call npm run import
pause
