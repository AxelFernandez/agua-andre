-- Script para inicializar datos de prueba en la base de datos
-- Este script se ejecuta automáticamente cuando TypeORM crea las tablas

-- Insertar Zonas
INSERT INTO zonas (nombre, valor, descripcion, "createdAt", "updatedAt") VALUES
('Gustavo André', 100, 'Zona principal de Gustavo André', NOW(), NOW()),
('Zona Norte', 101, 'Zona Norte del distrito', NOW(), NOW()),
('Zona Sur', 102, 'Zona Sur del distrito', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insertar Usuarios de prueba
-- Nota: La contraseña 'admin123' hasheada con bcrypt (10 rounds)
-- Hash: $2b$10$YQ8P8Z4KWXhV8K8qVZq3.eY7LqZ4xKZqZ8qZ8qZ8qZ8qZ8qZ8qZ8q

-- Administrativo
INSERT INTO usuarios (nombre, direccion, email, padron, rol, password, "zonaId", orden, tipo, "createdAt", "updatedAt") VALUES
('Admin Sistema', 'Oficina Central', 'admin@aguagandre.com', '100-0001', 'administrativo', '$2b$10$YQ8P8Z4KWXhV8K8qVZq3.eY7LqZ4xKZqZ8qZ8qZ8qZ8qZ8qZ8qZ8q', 1, 1, 'residencial', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Operario
INSERT INTO usuarios (nombre, direccion, email, padron, rol, password, "zonaId", orden, tipo, "createdAt", "updatedAt") VALUES
('Juan Pérez', 'Calle Principal 123', 'operario@aguagandre.com', '100-0002', 'operario', '$2b$10$YQ8P8Z4KWXhV8K8qVZq3.eY7LqZ4xKZqZ8qZ8qZ8qZ8qZ8qZ8qZ8q', 1, 1, 'residencial', NOW(), NOW())
ON CONFLICT DO NOTHING;


-- Nota: Los medidores y lecturas se pueden agregar manualmente desde el panel administrativo
-- o usando la API una vez que el sistema esté en funcionamiento

