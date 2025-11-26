# Sistema de Gestión de Agua Potable - Gustavo André

Sistema completo de gestión para asociaciones de agua potable con tres roles diferenciados: Cliente, Operario y Administrativo.

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Puerto 3000 (frontend), 3001 (backend) y 5432 (postgres) disponibles

### Instalación y Ejecución

1. **Iniciar el sistema completo:**
```bash
docker-compose up --build
```

Esto iniciará:
- PostgreSQL en puerto 5432
- Backend NestJS en puerto 3001
- Frontend React en puerto 3000

2. **Acceder al sistema:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Usuarios de Prueba

#### Acceso por Padrón (Clientes):
- Padrón: `100-0003` (María González)
- Padrón: `100-0004` (Pedro Rodríguez)
- Padrón: `101-0001` (Ana López)

#### Acceso Interno (Staff):

**Administrador:**
- Email: `admin@aguagandre.com`
- Contraseña: `admin123`

**Operario:**
- Email: `operario@aguagandre.com`
- Contraseña: `admin123`

## 📋 Funcionalidades por Rol

### 👤 Cliente
- Ver información de cuenta y padrón
- Consultar boletas de pago
- Ver historial de consumo
- Adjuntar comprobantes de pago
- Ver estado de pagos

### 👷 Operario
- Buscar usuarios por número de padrón
- Ver última lectura de medidores
- Registrar nuevas lecturas
- Cálculo automático de consumo en m³
- Visualizar información del medidor

### 🔧 Administrativo
- Gestión completa de usuarios
- Creación y administración de zonas
- Gestión de medidores
- Verificación de pagos (aprobar/rechazar)
- Visualización de todas las boletas
- Importación masiva de usuarios

## 🗂️ Estructura del Proyecto

```
asociacion-gvoandre/
├── backend/                 # Backend NestJS
│   ├── src/
│   │   ├── entities/       # Entidades TypeORM
│   │   ├── auth/           # Autenticación y autorización
│   │   ├── usuarios/       # Módulo de usuarios
│   │   ├── zonas/          # Módulo de zonas
│   │   ├── medidores/      # Módulo de medidores
│   │   ├── lecturas/       # Módulo de lecturas
│   │   ├── boletas/        # Módulo de boletas
│   │   └── pagos/          # Módulo de pagos
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── context/       # Context API (Auth)
│   │   └── App.js
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      # Configuración Docker
└── init-database.sql       # Script inicial de BD

```

## 🔑 API Endpoints Principales

### Autenticación
- `POST /auth/login/padron` - Login por padrón (clientes)
- `POST /auth/login/interno` - Login interno (operarios/admin)

### Usuarios
- `GET /usuarios` - Listar usuarios (Admin)
- `POST /usuarios` - Crear usuario (Admin)
- `GET /usuarios/padron/:padron` - Buscar por padrón

### Zonas
- `GET /zonas` - Listar zonas
- `POST /zonas` - Crear zona (Admin)

### Medidores
- `GET /medidores` - Listar medidores
- `POST /medidores` - Crear medidor (Admin)

### Lecturas
- `POST /lecturas` - Registrar lectura (Operario/Admin)
- `GET /lecturas/medidor/:id/ultima` - Obtener última lectura

### Boletas
- `GET /boletas/usuario/:id` - Boletas de un usuario
- `POST /boletas/generar` - Generar boleta (Admin)

### Pagos
- `POST /pagos` - Registrar pago (Cliente)
- `PUT /pagos/:id/aprobar` - Aprobar pago (Admin)
- `PUT /pagos/:id/rechazar` - Rechazar pago (Admin)

## 🗄️ Modelo de Datos

### Entidades Principales:
- **Usuario**: Información de clientes, operarios y administrativos
- **Zona**: Zonas geográficas con valores para generar padrones
- **Medidor**: Medidores de agua asignados a usuarios
- **Lectura**: Registro de lecturas mensuales
- **Boleta**: Facturas generadas por consumo
- **Pago**: Pagos realizados por los clientes

### Formato de Padrón
El padrón se genera automáticamente con el formato: `{valorZona}-{idUsuario}`

Ejemplo: Para Gustavo André (valor 100), el padrón sería `100-0001`, `100-0002`, etc.

## 🔄 Hot Reload

El proyecto está configurado con hot reload en ambos servicios:
- **Backend**: Usa `nest start --watch`
- **Frontend**: Usa `react-scripts start`

Los cambios en el código se reflejan automáticamente sin necesidad de reiniciar los contenedores.

## 🛠️ Comandos Útiles

### Ver logs
```bash
docker-compose logs -f
```

### Reiniciar servicios
```bash
docker-compose restart
```

### Detener servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (reinicio completo)
```bash
docker-compose down -v
```

### Acceder a la base de datos
```bash
docker exec -it agua_db psql -U postgres -d agua_potable
```

## 📝 Notas Importantes

1. **Seguridad**: Las contraseñas de ejemplo deben cambiarse en producción
2. **Base de Datos**: TypeORM está configurado con `synchronize: true` solo para desarrollo
3. **CORS**: Configurado para localhost:3000, ajustar para producción
4. **JWT**: Cambiar la clave secreta en variables de entorno para producción

## 🎨 Tecnologías Utilizadas

### Backend
- NestJS 10
- TypeORM
- PostgreSQL
- JWT Authentication
- bcrypt

### Frontend
- React 18
- React Router v6
- Axios
- TailwindCSS

### DevOps
- Docker
- Docker Compose

## 📱 Flujo de Trabajo Típico

1. **Cliente**: Ingresa con su padrón → Ve sus boletas → Realiza pago → Adjunta comprobante
2. **Operario**: Ingresa con credenciales → Busca usuario por padrón → Registra lectura del mes
3. **Administrativo**: Revisa lecturas → Genera boletas → Verifica pagos → Gestiona usuarios/zonas

## 🆘 Solución de Problemas

### El backend no se conecta a la base de datos
- Verificar que PostgreSQL esté corriendo: `docker ps`
- Verificar variables de entorno en docker-compose.yml

### El frontend no se conecta al backend
- Verificar que REACT_APP_API_URL apunte a http://localhost:3001
- Verificar que el backend esté corriendo en el puerto 3001

### Error de permisos en Docker
- En Linux/Mac, puede necesitar ejecutar con `sudo`

## 📧 Contacto y Soporte

Para consultas sobre el sistema, contactar al administrador del proyecto.

