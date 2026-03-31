#!/bin/bash
# ================================================
# KURTBOT - Script de instalación automática
# Ubuntu + Docker | Campaña Kurt Reintsch LIBRE
# ================================================
set -e

# Colores
RED='\033[0;31m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ${WHITE}🤖 KURTBOT — Instalación Automática${BLUE}         ║${NC}"
echo -e "${BLUE}║  ${WHITE}LIBRE · Libertad y República · La Paz${BLUE}       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Verificar Docker ──────────────────────────────────────
echo -e "${YELLOW}[1/5]${NC} Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker no encontrado. Instálalo con: sudo apt install docker.io${NC}"
    exit 1
fi
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${YELLOW}  Instalando docker-compose...${NC}"
    sudo apt-get update -qq && sudo apt-get install -y docker-compose-plugin
fi
echo -e "${GREEN}✓ Docker OK${NC}"

# ── Verificar archivo .env ────────────────────────────────
echo -e "${YELLOW}[2/5]${NC} Verificando configuración..."
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ No se encontró el archivo .env${NC}"
    echo -e "  Copia .env.example a .env y edita tu API Key"
    exit 1
fi

# Verificar que la API key no es la de ejemplo
if grep -q "PON_TU_CLAVE_AQUI" .env; then
    echo -e "${RED}✗ Debes editar el archivo .env con tu API Key de Anthropic${NC}"
    echo -e "  Edítalo con: nano .env"
    exit 1
fi
echo -e "${GREEN}✓ Configuración OK${NC}"

# ── Crear directorios de persistencia ────────────────────
echo -e "${YELLOW}[3/5]${NC} Preparando directorios..."
mkdir -p whatsapp-session data
echo -e "${GREEN}✓ Directorios listos${NC}"

# ── Construir imagen Docker ───────────────────────────────
echo -e "${YELLOW}[4/5]${NC} Construyendo imagen Docker (3-5 minutos la primera vez)..."
docker compose build --no-cache 2>&1 | tail -5
echo -e "${GREEN}✓ Imagen construida${NC}"

# ── Arrancar el bot ───────────────────────────────────────
echo -e "${YELLOW}[5/5]${NC} Iniciando KurtBot..."
docker compose up -d
sleep 3

# Verificar que está corriendo
if docker ps | grep -q kurtbot; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ¡KURTBOT INSTALADO Y CORRIENDO!          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Obtener IP local
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    echo -e "${WHITE}📊 Panel Admin:${NC}  http://localhost:3000/admin"
    echo -e "${WHITE}📊 Desde tu PC:${NC}  http://${LOCAL_IP}:3000/admin"
    echo ""
    echo -e "${YELLOW}⚡ PRÓXIMO PASO:${NC}"
    echo -e "   Ver el código QR para conectar WhatsApp:"
    echo -e "   ${WHITE}docker logs kurtbot --follow${NC}"
    echo ""
    echo -e "${BLUE}El Boliviano Puede 🇧🇴🔵🔴⚪${NC}"
else
    echo -e "${RED}✗ Error al iniciar. Ver logs con: docker logs kurtbot${NC}"
    exit 1
fi
