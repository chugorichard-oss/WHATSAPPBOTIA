#!/bin/bash
# ================================================
# KURTBOT - Gestión del Bot
# Uso: ./bot.sh [comando]
# ================================================

RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

header() {
    echo -e "${BLUE}🤖 KurtBot Manager · LIBRE La Paz${NC}"
    echo "────────────────────────────────"
}

case "$1" in
    start)
        header
        echo -e "${YELLOW}▶ Iniciando KurtBot...${NC}"
        docker compose up -d
        sleep 2
        if docker ps | grep -q kurtbot; then
            LOCAL_IP=$(hostname -I | awk '{print $1}')
            echo -e "${GREEN}✅ Bot corriendo${NC}"
            echo -e "   Panel: http://${LOCAL_IP}:3000/admin"
        fi
        ;;

    stop)
        header
        echo -e "${YELLOW}⏹ Deteniendo KurtBot...${NC}"
        docker compose stop
        echo -e "${GREEN}✅ Bot detenido${NC}"
        ;;

    restart)
        header
        echo -e "${YELLOW}🔄 Reiniciando KurtBot...${NC}"
        docker compose restart
        sleep 3
        echo -e "${GREEN}✅ Bot reiniciado${NC}"
        ;;

    status)
        header
        echo -e "${WHITE}Estado del contenedor:${NC}"
        docker ps --filter name=kurtbot --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        LOCAL_IP=$(hostname -I | awk '{print $1}')
        echo -e "${WHITE}Panel Admin:${NC} http://${LOCAL_IP}:3000/admin"
        ;;

    logs)
        header
        echo -e "${WHITE}Últimas 50 líneas de log (Ctrl+C para salir):${NC}"
        echo ""
        docker logs kurtbot --tail 50 --follow
        ;;

    qr)
        header
        echo -e "${YELLOW}📱 Mostrando QR de WhatsApp (Ctrl+C cuando escanees):${NC}"
        echo ""
        docker logs kurtbot --follow 2>&1 | grep -A 30 "ESCANEA\|QR\|▄\|█" || \
        echo -e "${BLUE}💡 También puedes ver el QR en el panel web:${NC}"
        LOCAL_IP=$(hostname -I | awk '{print $1}')
        echo -e "   http://${LOCAL_IP}:3000/admin"
        ;;

    update)
        header
        echo -e "${YELLOW}🔄 Actualizando bot (rebuild)...${NC}"
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        echo -e "${GREEN}✅ Bot actualizado y corriendo${NC}"
        ;;

    reset-wa)
        header
        echo -e "${RED}⚠ Esto eliminará la sesión de WhatsApp. Tendrás que escanear QR de nuevo.${NC}"
        read -p "¿Continuar? (s/N): " confirm
        if [[ "$confirm" == "s" || "$confirm" == "S" ]]; then
            docker compose stop
            rm -rf ./whatsapp-session/*
            docker compose up -d
            echo -e "${GREEN}✅ Sesión eliminada. Escanea el nuevo QR con: ./bot.sh qr${NC}"
        fi
        ;;

    *)
        header
        echo -e "${WHITE}Comandos disponibles:${NC}"
        echo ""
        echo -e "  ${GREEN}./bot.sh start${NC}      ▶  Iniciar el bot"
        echo -e "  ${GREEN}./bot.sh stop${NC}       ⏹  Detener el bot"
        echo -e "  ${GREEN}./bot.sh restart${NC}    🔄  Reiniciar el bot"
        echo -e "  ${GREEN}./bot.sh status${NC}     📊  Ver estado"
        echo -e "  ${GREEN}./bot.sh logs${NC}       📋  Ver logs en vivo"
        echo -e "  ${GREEN}./bot.sh qr${NC}         📱  Ver QR para WhatsApp"
        echo -e "  ${GREEN}./bot.sh update${NC}     ⬆  Reconstruir imagen"
        echo -e "  ${GREEN}./bot.sh reset-wa${NC}   🔁  Resetear sesión WhatsApp"
        echo ""
        ;;
esac
