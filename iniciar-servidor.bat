@echo off
REM ============================================================
REM FF GAMES — Servidor local de prueba
REM Doble clic en este archivo para levantar el juego en tu
REM navegador sin depender de GitHub Pages.
REM ============================================================

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando servidor local con Python en http://localhost:8080 ...
    start "" http://localhost:8080/index.html
    python -m http.server 8080
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Iniciando servidor local con Python en http://localhost:8080 ...
    start "" http://localhost:8080/index.html
    py -m http.server 8080
    goto :eof
)

echo.
echo No se encontro Python instalado en este equipo.
echo.
echo Opciones:
echo   1. Instala Python desde https://www.python.org/downloads/
echo      (marca la casilla "Add Python to PATH" durante la instalacion)
echo      y vuelve a abrir este archivo.
echo   2. O instala la extension "Live Server" en Visual Studio Code,
echo      abre esta carpeta en VS Code y da clic derecho sobre index.html
echo      - "Open with Live Server".
echo.
pause
