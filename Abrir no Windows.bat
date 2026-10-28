@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 servidor.py
) else (
  python servidor.py
)
if errorlevel 1 (
  echo Instale o Python 3.10 ou mais recente e tente novamente.
  echo Alternativa sem banco: abra index.html e salve arquivos para editar depois.
  pause
)
