#!/bin/bash

echo "🔧 Reconstruyendo backend con módulo de auditoría..."
docker-compose build backend

echo ""
echo "🚀 Reiniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando que el backend se inicie..."
sleep 5

echo ""
echo "✅ Verificando tabla de auditoría..."
docker-compose exec -T postgres psql -U postgres -d agua_potable -c "SELECT COUNT(*) as total_registros FROM auditoria_registros;" 2>/dev/null || echo "⚠️  La tabla aún no existe. Verifica los logs del backend."

echo ""
echo "📋 Logs del backend:"
docker-compose logs --tail=30 backend

echo ""
echo "✨ ¡Listo! El backend debería estar corriendo con el módulo de auditoría."
echo "   Probá acceder a: http://localhost:3001/auditoria"

