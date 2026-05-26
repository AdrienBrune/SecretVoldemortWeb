#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_EXE="$SCRIPT_DIR/SecretVoldemortServer"

if [ ! -f "$SERVER_EXE" ]; then
    echo "[ERREUR] Executable introuvable : $SERVER_EXE"
    echo "Compilez le projet avec : cmake --build Server/build --config Release"
    exit 1
fi

echo "[INFO] Demarrage du serveur Secret Voldemort..."
echo "[INFO] WebSocket disponible sur ws://localhost:9001/ws"
echo "[INFO] Ctrl+C pour arreter"
echo ""

exec "$SERVER_EXE"
