#!/bin/bash
# ==========================================
# Configuración Inicial del VPS
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Configuración Inicial del VPS${NC}"
echo -e "${BLUE}========================================${NC}"

# Actualizar sistema
echo -e "${YELLOW}→ Actualizando sistema...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ Sistema actualizado${NC}"

# Instalar dependencias
echo -e "${YELLOW}→ Instalando dependencias...${NC}"
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release git ufw
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Instalar Docker
echo -e "${YELLOW}→ Instalando Docker...${NC}"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
systemctl start docker
echo -e "${GREEN}✓ Docker instalado${NC}"

# Instalar Nginx
echo -e "${YELLOW}→ Instalando Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx instalado${NC}"

# Configurar firewall
echo -e "${YELLOW}→ Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo -e "${GREEN}✓ Firewall configurado${NC}"

# Instalar Certbot
echo -e "${YELLOW}→ Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot instalado${NC}"

# Crear directorios
echo -e "${YELLOW}→ Creando estructura de directorios...${NC}"
mkdir -p /var/www/agua-potable-prod
mkdir -p /var/www/agua-potable-test
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
echo -e "${GREEN}✓ Directorios creados${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Configuración completada${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}SIGUIENTES PASOS:${NC}"
echo ""
echo "1. Clonar repositorio en ambas carpetas:"
echo "   ${BLUE}git clone -b master TU_REPO /var/www/agua-potable-prod${NC}"
echo "   ${BLUE}git clone -b developer TU_REPO /var/www/agua-potable-test${NC}"
echo ""
echo "2. Configurar Nginx:"
echo "   ${BLUE}cd /var/www/agua-potable-prod${NC}"
echo "   ${BLUE}cp nginx/sites-available/*.conf /etc/nginx/sites-available/${NC}"
echo "   ${BLUE}ln -s /etc/nginx/sites-available/agua-prod.conf /etc/nginx/sites-enabled/${NC}"
echo "   ${BLUE}ln -s /etc/nginx/sites-available/agua-test.conf /etc/nginx/sites-enabled/${NC}"
echo "   ${BLUE}rm -f /etc/nginx/sites-enabled/default${NC}"
echo "   ${BLUE}nginx -t && systemctl reload nginx${NC}"
echo ""
echo "3. Configurar DNS (apuntar a este servidor):"
echo "   - asocaguapzoga.com.ar"
echo "   - api.asocaguapzoga.com.ar"
echo "   - test.asocaguapzoga.com.ar"
echo "   - api-test.asocaguapzoga.com.ar"
echo ""
echo "4. Obtener certificados SSL:"
echo "   ${BLUE}certbot certonly --nginx -d asocaguapzoga.com.ar${NC}"
echo "   ${BLUE}certbot certonly --nginx -d api.asocaguapzoga.com.ar${NC}"
echo "   ${BLUE}certbot certonly --nginx -d test.asocaguapzoga.com.ar${NC}"
echo "   ${BLUE}certbot certonly --nginx -d api-test.asocaguapzoga.com.ar${NC}"
echo ""
echo "5. Crear .env en cada carpeta y desplegar:"
echo "   ${BLUE}cd /var/www/agua-potable-test && nano .env.test && ./deploy-test.sh${NC}"
echo "   ${BLUE}cd /var/www/agua-potable-prod && nano .env.prod && ./deploy-prod.sh${NC}"
