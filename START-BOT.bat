@echo off
chcp 65001 >nul
title Model Finder - Bot
cd /d "%~dp0backend"
echo Model Finder ishga tushmoqda (bot + API + tunnel)...
echo Bot ishlashi uchun bu oynani YOPMANG.
echo.
call npm start
pause
