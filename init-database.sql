-- Script para inicializar datos de prueba en la base de datos
-- Este script se ejecuta automáticamente cuando TypeORM crea las tablas

-- Insertar Zonas
INSERT INTO zonas (nombre, valor, descripcion, "createdAt", "updatedAt") VALUES
('Gustavo André', 100, 'Operario: Luis Ríos', NOW(), NOW()),
('Asunción', 200, 'Operario: Jofre Javier', NOW(), NOW()),
('Retiro', 300, 'Operario: Perez Matias', NOW(), NOW()),
('San Miguel / Puerto', 400, 'Operario: Villegas Aldo / Lucero Ramon', NOW(), NOW()),
('Retamo / Forzudo', 500, 'Operario: Zalaba Juan / Soria Jose', NOW(), NOW()),
('San Jose', 600, 'Operario: Gonzalez Edgar', NOW(), NOW()),
('Lagunas Del Rosario', 700, 'Operario: Zalazar Juan', NOW(), NOW()),
ON CONFLICT DO NOTHING;

-- Insertar Usuarios de prueba
-- Nota: La contraseña 'admin123' hasheada con bcrypt (10 rounds)
-- Hash: $2b$10$YQ8P8Z4KWXhV8K8qVZq3.eY7LqZ4xKZqZ8qZ8qZ8qZ8qZ8qZ8qZ8q

-- Administrativo (sin padrón - los padrones son exclusivos para clientes)
INSERT INTO usuarios (nombre, direccion, email, rol, password, "createdAt", "updatedAt") VALUES
('Admin Sistema', 'Oficina Central', 'admin@aguagandre.com', 'administrativo', '$2b$10$YQ8P8Z4KWXhV8K8qVZq3.eY7LqZ4xKZqZ8qZ8qZ8qZ8qZ8qZ8qZ8q', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Operario (sin padrón - los padrones son exclusivos para clientes)
INSERT INTO usuarios (nombre, direccion, email, rol, password, "createdAt", "updatedAt") VALUES
('Juan Pérez', 'Calle Principal 123', 'operario@aguagandre.com', 'operario', '$2b$10$YQ8P8Z4KWXhV8K8qVZq3.eY7LqZ4xKZqZ8qZ8qZ8qZ8qZ8qZ8qZ8q', NOW(), NOW())
ON CONFLICT DO NOTHING;


-- Nota: Los medidores y lecturas se pueden agregar manualmente desde el panel administrativo
-- o usando la API una vez que el sistema esté en funcionamiento

