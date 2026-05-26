@echo off
setlocal

set ROOT_DIR=%~dp0
set SERVER_EXE=Release\SecretVoldemortServer.exe
set BUILD_DIR=Server\build

:: default - release mode
set CONFIG_TYPE=Release
set REACT_DEBUG_FLAG=OFF

if "%1"=="-d" (
    set CONFIG_TYPE=Debug
    set REACT_DEBUG_FLAG=ON
)

:: ── Option -r/-d : compilation ───────────────────────────────────────────────────
set MATCH=
if "%1"=="-r" set MATCH=true
if "%1"=="-d" set MATCH=true

if defined MATCH (
    echo [COMPILE] Configuration CMake...
    if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
    cmake -S . -B "%BUILD_DIR%" -DCMAKE_BUILD_TYPE=%CONFIG_TYPE% -DENABLE_REACT_DEBUG=%REACT_DEBUG_FLAG%
    if errorlevel 1 ( echo [ERREUR] cmake configure a echoue & pause & exit /b 1 )

    echo.
    echo [COMPILE] Build serveur + client React...
    cmake --build "%BUILD_DIR%" --config %CONFIG_TYPE%
    if errorlevel 1 ( echo [ERREUR] cmake build a echoue & pause & exit /b 1 )

    echo.
    echo [OK] Compilation terminee.
    echo.
)

:: ── Verification exe serveur ──────────────────────────────────────────────────
if not exist "%SERVER_EXE%" (
    echo [ERREUR] Executable introuvable : %SERVER_EXE%
    echo Lancez ce script avec l'option -r pour compiler en release et -d pour compiler en debug : start_server.bat -r/-d
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
