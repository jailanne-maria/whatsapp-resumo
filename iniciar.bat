@echo off
chcp 65001 >nul
title WhatsApp Resumo
cd /d "%~dp0"
call npm start
pause
