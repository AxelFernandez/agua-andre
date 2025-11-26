#!/bin/bash

echo "🌊 Sistema de Gestión de Agua Potable - Gustavo André"
echo "======================================================"
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"
echo ""

# Crear archivos .env si no existen
if [ ! -f backend/.env ]; then
    echo "📝 Creando archivo backend/.env..."
    cat > backend/.env << EOF
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=agua_potable
JWT_SECRET=secret-jwt-key-change-in-production
PORT=3001
EOF
    echo "✅ Archivo backend/.env creado"
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creando archivo frontend/.env..."
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001
EOF
    echo "✅ Archivo frontend/.env creado"
fi

echo ""
echo "🚀 Iniciando el sistema..."
echo ""

# Detener contenedores anteriores si existen
docker-compose down -v 2>/dev/null

# Construir e iniciar los contenedores
docker-compose up --build -d

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo "✅ Sistema iniciado correctamente!"
echo ""
echo "📍 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo ""
echo "👤 Usuarios de prueba:"
echo ""
echo "   CLIENTES (acceso por padrón):"
echo "   - Padrón: 100-0003"
echo "   - Padrón: 100-0004"
echo "   - Padrón: 101-0001"
echo ""
echo "   ADMINISTRATIVO:"
echo "   - Email: admin@aguagandre.com"
echo "   - Contraseña: admin123"
echo ""
echo "   OPERARIO:"
echo "   - Email: operario@aguagandre.com"
echo "   - Contraseña: admin123"
echo ""
echo "📋 Ver logs: docker-compose logs -f"
echo "🛑 Detener: docker-compose down"
echo ""
echo "🎉 ¡Listo para usar!"

