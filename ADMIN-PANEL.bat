@echo off
chcp 65001 >nul
title Model Finder - Admin panel
cd /d "%~dp0admin-panel"
echo Admin panel brauzerda ochiladi: http://localhost:5174
echo (START-BOT.bat ham ishlab turgan bo'lishi kerak)
echo.
call npm run dev -- --open
pause
