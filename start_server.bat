@echo off
setlocal

set ROOT_DIR=%~dp0
set SERVER_EXE=Release\SecretVoldemortServer.exe
set BUILD_DIR=Server\build

:: ── Option -c : compilation ───────────────────────────────────────────────────
if "%1"=="-c" (
    echo [COMPILE] Configuration CMake...
    if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
    cmake -S . -B "%BUILD_DIR%" -DCMAKE_BUILD_TYPE=Release
    if errorlevel 1 ( echo [ERREUR] cmake configure a echoue & pause & exit /b 1 )

    echo.
    echo [COMPILE] Build serveur + client React...
    cmake --build "%BUILD_DIR%" --config Release
    if errorlevel 1 ( echo [ERREUR] cmake build a echoue & pause & exit /b 1 )

    echo.
    echo [OK] Compilation terminee.
    echo.
)

:: ── Verification exe serveur ──────────────────────────────────────────────────
if not exist "%SERVER_EXE%" (
    echo [ERREUR] Executable introuvable : %SERVER_EXE%
    echo Lancez ce script avec l'option -c pour compiler : start_server.bat -c
    pause
    exit /b 1
)

:: ── Lancement serveur (depuis Release/ pour que www/ soit trouve) ─────────────
echo [INFO] Demarrage du serveur...
start "SecretVoldemort - Serveur" cmd /k "cd /d "%ROOT_DIR%Release" && SecretVoldemortServer.exe"

echo.
echo [INFO] Jeu disponible sur http://127.0.0.1:8080
echo [INFO] WebSocket        : ws://127.0.0.1:8080/ws
echo [INFO] Fermez la fenetre serveur pour arreter.

timeout /t 2 /nobreak >nul
start http://127.0.0.1:8080

endlocal
