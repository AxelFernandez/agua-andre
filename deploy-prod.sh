#!/bin/bash
# ==========================================
# Deploy PRODUCCIÓN - Build Optimizado
# Rama: master
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/var/www/agua-potable-prod"
BRANCH="master"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploy PRODUCCIÓN${NC}"
echo -e "${BLUE}========================================${NC}"

# Verificar .env.prod
if [ ! -f ".env.prod" ]; then
    echo -e "${RED}✗ No se encontró .env.prod${NC}"
    exit 1
fi

# Confirmación
echo -e "${YELLOW}⚠ Vas a desplegar en PRODUCCIÓN${NC}"
read -p "¿Continuar? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deploy cancelado"
    exit 0
fi

# Git pull
echo -e "${YELLOW}→ Obteniendo últimos cambios (rama: $BRANCH)...${NC}"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
echo -e "${GREEN}✓ Código actualizado${NC}"

# Build y deploy
echo -e "${YELLOW}→ Construyendo imágenes optimizadas...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache

echo -e "${YELLOW}→ Desplegando contenedores...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.prod down
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo -e "${GREEN}✓ Contenedores iniciados${NC}"

# Limpieza
echo -e "${YELLOW}→ Limpiando recursos no utilizados...${NC}"
docker image prune -f
echo -e "${GREEN}✓ Limpieza completada${NC}"

# Estado
echo ""
docker compose -f docker-compose.prod.yml ps
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deploy completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Frontend: ${BLUE}https://asocaguapzoga.com.ar${NC}"
echo -e "API:      ${BLUE}https://api.asocaguapzoga.com.ar${NC}"

