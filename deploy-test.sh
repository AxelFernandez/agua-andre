#!/bin/bash
# ==========================================
# Deploy TEST - Hot Reload Activado
# Rama: developer
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/var/www/agua-potable-test"
BRANCH="developer"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deploy TEST - Hot Reload${NC}"
echo -e "${BLUE}========================================${NC}"

# Verificar .env.test
if [ ! -f ".env.test" ]; then
    echo -e "${RED}✗ No se encontró .env.test${NC}"
    exit 1
fi

# Git pull
echo -e "${YELLOW}→ Obteniendo últimos cambios (rama: $BRANCH)...${NC}"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
echo -e "${GREEN}✓ Código actualizado${NC}"

# Deploy con hot reload
echo -e "${YELLOW}→ Desplegando contenedores (hot reload activo)...${NC}"
docker compose -f docker-compose.test.yml --env-file .env.test down
docker compose -f docker-compose.test.yml --env-file .env.test up -d --build

echo -e "${GREEN}✓ Contenedores iniciados${NC}"

# Estado
echo ""
docker compose -f docker-compose.test.yml ps
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deploy completado${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Frontend: ${BLUE}https://test.asocaguapzoga.com.ar${NC}"
echo -e "API:      ${BLUE}https://api-test.asocaguapzoga.com.ar${NC}"
echo ""
echo -e "${YELLOW}Hot reload activo: los cambios se reflejan automáticamente${NC}"

