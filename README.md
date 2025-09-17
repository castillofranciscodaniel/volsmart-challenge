# Volsmart Challenge API

API REST para gestión de usuarios, roles y nóminas con autenticación JWT y sistema de seguridad ABAC (Attribute-Based Access Control).

## 🏗️ Arquitectura

Este proyecto implementa una **arquitectura hexagonal (Clean Architecture)** con las siguientes capas:

### Estructura del Proyecto

```
src/
├── core/                    # Capa de dominio (Core Business Logic)
│   ├── constants/          # Constantes del sistema
│   ├── models/             # Entidades de dominio
│   ├── ports/              # Interfaces/Contratos (Puertos)
│   └── services/           # Casos de uso y lógica de negocio
├── adapters/               # Capa de adaptadores (Implementaciones)
│   └── *.repository.impl.ts # Implementaciones de repositorios
├── infraestructure/        # Capa de infraestructura
│   ├── postgress/          # Entidades de base de datos
│   ├── rest/               # Controladores REST
│   └── security/           # Sistema de seguridad y ABAC
└── repository/             # Repositorios de dominio
```

### Principios de la Arquitectura

- **Inversión de Dependencias**: Las capas internas no dependen de las externas
- **Separación de Responsabilidades**: Cada capa tiene una responsabilidad específica
- **Testabilidad**: Fácil testing mediante inyección de dependencias
- **Mantenibilidad**: Código organizado y fácil de mantener

## 🔐 Sistema de Seguridad Multi-Capa

### Arquitectura de Seguridad en Dos Niveles

El sistema implementa una **arquitectura de seguridad robusta** con dos capas de protección que funcionan a nivel de **interceptor**:

#### **1. Primera Capa: Guards de Roles (RBAC)**
- **Función**: Control de acceso básico basado en roles
- **Implementación**: `RolesGuard` - intercepta requests antes del controlador
- **Propósito**: Verificar que el usuario tenga el rol mínimo requerido para acceder al endpoint
- **Ejemplo**: Solo usuarios con rol `MANAGER` o `ADMIN` pueden acceder a `/users`

#### **2. Segunda Capa: Sistema ABAC (Attribute-Based Access Control)**
- **Función**: Control granular de acceso basado en atributos
- **Implementación**: `ABACUnifiedInterceptor` - intercepta requests después de la autorización de roles
- **Propósito**: Filtrado inteligente de campos sensibles según el contexto del usuario
- **Ejemplo**: `ADMIN` ve payrolls sin campo `salary`, `MANAGER` ve todos los campos

### Attribute-Based Access Control (ABAC)

El sistema ABAC evalúa el acceso basándose en:

- **Subject**: Usuario que realiza la acción
- **Resource**: Recurso al que se accede
- **Action**: Acción que se quiere realizar
- **Environment**: Contexto de la operación

### Configuración ABAC en Base de Datos

> **💡 Nota Importante**: La configuración completa del sistema ABAC se almacena directamente en la base de datos PostgreSQL, permitiendo modificaciones dinámicas sin necesidad de reiniciar la aplicación. Esta configuración incluye permisos, reglas de filtrado y políticas de acceso que se evalúan en tiempo real.

### Roles y Permisos

| Rol | Descripción | Permisos de Acceso |
|-----|-------------|-------------------|
| **MANAGER** | Gerente del sistema | ✅ **Acceso completo** a todos los datos del sistema<br/>✅ Puede crear, leer, actualizar y eliminar usuarios<br/>✅ Ve todos los campos incluyendo datos sensibles<br/>✅ Acceso completo a payrolls y roles |
| **ADMIN** | Administrador | ✅ **Ve todos los datos** del sistema (incluyendo passwords)<br/>✅ Puede crear, leer, actualizar y eliminar usuarios<br/>✅ Ve todos los campos incluyendo datos sensibles<br/>⚠️ **Ve payrolls SIN campo salary** (ABAC real)<br/>✅ Acceso completo a roles |
| **USER** | Usuario regular | ✅ **Solo ve SUS PROPIOS datos**<br/>✅ Acceso a su perfil únicamente<br/>❌ No puede ver datos de otros usuarios<br/>❌ No puede crear, actualizar o eliminar usuarios |

### Reglas de Negocio ABAC

#### **Jerarquía de Roles**
```
MANAGER (Máximo nivel)
    ↓
ADMIN (Nivel intermedio)
    ↓
USER (Nivel básico)
```

#### **Tipos de Acceso por Operación**
- **`canRead`**: Permisos de lectura
  - **`full`**: Ve todos los campos incluyendo sensibles
  - **`partial`**: Ve todos los campos sin sensibles
  - **`self`**: Solo sus propios datos
  - **`blocked`**: Sin acceso de lectura
- **`canWrite`**: Permisos de escritura
  - **`full`**: Puede modificar todos los campos
  - **`partial`**: Puede modificar campos no sensibles
  - **`self`**: Solo puede modificar sus propios datos
  - **`blocked`**: Sin acceso de escritura
- **`canDelete`**: Permisos de eliminación
  - **`full`**: Puede eliminar cualquier recurso
  - **`blocked`**: Sin acceso de eliminación

#### **Configuración Actual de Permisos**
```json
{
  "MANAGER": {
    "canRead": "full",      // Ve todos los campos incluyendo sensibles
    "canWrite": "full",     // Puede modificar todo
    "canDelete": "full"     // Puede eliminar cualquier recurso
  },
  "ADMIN": {
    "canRead": "full",      // Ve todos los campos incluyendo sensibles
    "canWrite": "partial",  // Puede modificar campos no sensibles
    "canDelete": "full"     // Puede eliminar cualquier recurso
  },
  "ADMIN_PAYROLLS": {
    "canRead": "partial",   // Ve payrolls SIN campo salary (ABAC real)
    "canWrite": "partial",  // Puede modificar pero sin salary
    "canDelete": "full"     // Puede eliminar payrolls
  },
  "USER": {
    "canRead": "partial",   // Ve campos no sensibles
    "canWrite": "blocked",  // No puede modificar
    "canDelete": "blocked"  // No puede eliminar
  }
}
```

### Implementación del Sistema de Seguridad

El sistema de seguridad se implementa mediante **dos interceptores** que trabajan en secuencia:

```typescript
@UseGuards(RolesGuard)  // 1. Primera capa: Verificación de roles
@UseABAC()              // 2. Segunda capa: Filtrado ABAC
async getAllUsers(@Request() req): Promise<UserModel[]> {
  // 1. RolesGuard verifica que el usuario tenga rol MANAGER o ADMIN
  // 2. ABACUnifiedInterceptor evalúa automáticamente:
  //    - Subject: req.user (usuario autenticado)
  //    - Resource: 'users' (recurso solicitado)
  //    - Action: 'read' (acción de lectura)
  //    - Environment: contexto de la petición
}
```

#### **Flujo de Funcionamiento del Sistema de Seguridad**

1. **Interceptación de Request**: El `RolesGuard` intercepta la request HTTP
2. **Verificación de Roles**: Valida que el usuario tenga el rol mínimo requerido
3. **Autorización RBAC**: Si pasa la verificación de roles, continúa al siguiente interceptor
4. **Interceptación ABAC**: El `ABACUnifiedInterceptor` intercepta la request autorizada
5. **Identificación del Recurso**: Mapea la URL al recurso correspondiente (`/users` → `users`)
6. **Consulta de Permisos ABAC**: Consulta la configuración ABAC desde la base de datos
7. **Filtrado de Entrada** (POST/PUT/DELETE): Filtra campos sensibles del body de la request
8. **Ejecución del Controller**: Se ejecuta la lógica de negocio con datos ya filtrados
9. **Filtrado de Salida** (GET/POST/PUT/DELETE): Filtra campos sensibles de la respuesta antes de enviarla

#### **Arquitectura del Sistema de Seguridad Multi-Capa**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RolesGuard    │───▶│ ABACUnified      │───▶│   Controller    │
│   (RBAC)        │    │ Interceptor      │    │   @UseGuards    │
│                 │    │ (ABAC)           │    │   @UseABAC()    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Verificación   │    │  Filtrado de     │    │  Lógica de      │
│  de Roles       │    │  Entrada/Salida  │    │  Negocio        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │  ABACService    │
│ (Configuración  │    │                 │
│  de Roles)      │    └─────────────────┘
└─────────────────┘             │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │ (Configuración  │
                       │  ABAC)          │
                       └─────────────────┘
```

#### **Flujo de Interceptores en NestJS**

```
Request HTTP
     │
     ▼
┌─────────────┐
│ RolesGuard  │ ← Interceptor 1: Verificación de roles
│ (RBAC)      │   - Verifica que el usuario tenga el rol requerido
│             │   - Si falla: 403 Forbidden
└─────────────┘
     │ ✅ Autorizado
     ▼
┌─────────────┐
│ ABAC        │ ← Interceptor 2: Filtrado ABAC
│ Interceptor │   - Filtra campos sensibles de entrada
│ (ABAC)      │   - Consulta configuración en BD
└─────────────┘
     │ ✅ Filtrado de entrada
     ▼
┌─────────────┐
│ Controller  │ ← Ejecuta lógica de negocio
│ Logic       │   con datos ya filtrados
└─────────────┘
     │
     ▼
┌─────────────┐
│ ABAC        │ ← Interceptor 2: Filtrado de salida
│ Interceptor │   - Filtra campos sensibles de respuesta
│ (ABAC)      │
└─────────────┘
     │ ✅ Filtrado de salida
     ▼
Response HTTP
```


#### **Tipos de Filtrado**

**1. Filtrado de Entrada (POST/PUT/DELETE)**
- **MANAGER**: Sin filtrado - puede enviar todos los campos
- **ADMIN**: Campos sensibles ignorados silenciosamente
- **USER**: Sin acceso a operaciones de escritura

**2. Filtrado de Salida (GET/POST/PUT/DELETE)**
- **MANAGER**: Ve todos los campos incluyendo sensibles
- **ADMIN**: Ve todos los campos incluyendo sensibles
- **USER**: Solo ve sus propios datos

#### **Campos Sensibles por Recurso**

```typescript
const sensitiveFieldsMap = {
  'users': ['password', 'passwordForTesting', 'salary'],
  'payrolls': ['salary'], // Campo salary es sensible en payrolls
  'roles': [] // No hay campos sensibles en roles
};
```

#### **ABAC Real por Recurso**

El sistema implementa **ABAC real** donde los permisos varían por recurso:

| Recurso | MANAGER | ADMIN | USER |
|---------|---------|-------|------|
| **users** | `canRead: "full"` | `canRead: "full"` | `canRead: "partial"` |
| **payrolls** | `canRead: "full"` | `canRead: "partial"` | `canRead: "partial"` |
| **roles** | `canRead: "full"` | `canRead: "full"` | `canRead: "blocked"` |

**Ejemplo de ABAC Real:**
- **MANAGER** ve payrolls con todos los campos: `{id, userId, salary, period}`
- **ADMIN** ve payrolls sin campo salary: `{id, userId, period}` (salary filtrado por ABAC)
- **USER** ve solo sus propios payrolls sin salary: `{id, userId, period}`

#### **Ejemplo de Funcionamiento**

```typescript
// 1. Usuario ADMIN hace POST /users
{
  "email": "test@example.com",
  "password": "secret123",
  "salary": 50000
}

// 2. Interceptor verifica permisos
// ADMIN tiene canWrite: "partial"

// 3. Filtrado de entrada (campos sensibles ignorados)
{
  "email": "test@example.com"
  // password y salary ignorados silenciosamente
}

// 4. Usuario se crea con campos por defecto
// 5. Respuesta filtrada según canRead del usuario
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd volsmart-challenge
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=volsmart_challenge

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Application
PORT=3000
NODE_ENV=development
```

### 4. Levantar la Base de Datos

```bash
docker-compose up -d
```

### 5. Ejecutar Migraciones

```bash
npm run migration:run
```

### 6. Iniciar la Aplicación

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📚 Uso de la API

### Autenticación

#### 1. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": {
      "name": "ADMIN",
      "description": "Administrator"
    }
  }
}
```

### Endpoints Disponibles

#### Usuarios

| Método | Endpoint | Descripción | Roles Requeridos | Filtrado ABAC |
|--------|----------|-------------|------------------|---------------|
| GET | `/users` | Obtener todos los usuarios | MANAGER, ADMIN, USER | MANAGER: ve todos los campos incluyendo sensibles<br/>ADMIN: ve todos los campos incluyendo sensibles<br/>USER: ve solo sus propios datos |
| GET | `/users/:id` | Obtener usuario por ID | MANAGER, ADMIN, USER | MANAGER: ve todos los campos incluyendo sensibles<br/>ADMIN: ve todos los campos incluyendo sensibles<br/>USER: ve solo sus propios datos |
| POST | `/users` | Crear nuevo usuario | MANAGER, ADMIN | MANAGER: sin filtrado<br/>ADMIN: sin filtrado |
| PUT | `/users/:id` | Actualizar usuario | MANAGER, ADMIN | MANAGER: sin filtrado<br/>ADMIN: campos sensibles ignorados |
| DELETE | `/users/:id` | Eliminar usuario | MANAGER, ADMIN | Sin restricciones |
| GET | `/users/profile/me` | Obtener mi perfil | Cualquier usuario autenticado | Sin filtrado |

#### Roles

| Método | Endpoint | Descripción | Roles Requeridos | Filtrado ABAC |
|--------|----------|-------------|------------------|---------------|
| GET | `/roles` | Obtener todos los roles | MANAGER, ADMIN | MANAGER: ve todos los campos<br/>ADMIN: ve todos los campos |
| GET | `/roles/:id` | Obtener rol por ID | MANAGER, ADMIN | MANAGER: ve todos los campos<br/>ADMIN: ve todos los campos |
| GET | `/roles/name/:name` | Obtener rol por nombre | MANAGER, ADMIN | MANAGER: ve todos los campos<br/>ADMIN: ve todos los campos |
| POST | `/roles` | Crear nuevo rol | MANAGER, ADMIN | MANAGER: puede crear MANAGER/ADMIN<br/>ADMIN: solo puede crear ADMIN |
| PUT | `/roles/:id` | Actualizar rol | MANAGER, ADMIN | MANAGER: puede modificar cualquier rol<br/>ADMIN: solo puede modificar ADMIN/USER |
| DELETE | `/roles/:id` | Eliminar rol | MANAGER | Solo MANAGER puede eliminar |

#### Nóminas

| Método | Endpoint | Descripción | Roles Requeridos | Filtrado ABAC |
|--------|----------|-------------|------------------|---------------|
| GET | `/payrolls` | Obtener nóminas | MANAGER, ADMIN, USER | MANAGER: ve todos los campos incluyendo salary<br/>ADMIN: ve todos los campos excepto salary (ABAC real)<br/>USER: ve solo sus propias nóminas sin salary |
| POST | `/payrolls` | Crear nueva nómina | MANAGER, ADMIN | MANAGER: sin filtrado<br/>ADMIN: campos sensibles ignorados |

### Ejemplos de Uso

#### Obtener Todos los Usuarios (ADMIN)

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Crear Nuevo Usuario (ADMIN)

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "salary": 50000,
    "role": {
      "name": "USER",
      "description": "Regular user"
    }
  }'
```

#### Obtener Mi Perfil

```bash
curl -X GET http://localhost:3000/users/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

### Colección de Postman

El proyecto incluye una colección completa de Postman con todos los endpoints:

**Archivo:** `Volsmart-Challenge-API-Complete.postman_collection.json`

#### Cómo usar la colección:

1. Importar la colección en Postman
2. Configurar las variables de entorno:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (se llena automáticamente después del login)
   - `userId`: ID del usuario para testing
   - `roleId`: ID del rol para testing
   - `roleName`: Nombre del rol (ej: "ADMIN")

3. Ejecutar el flujo:
   - Login como Admin/Manager/User
   - Probar endpoints según el rol

### Usuarios de Prueba

| Email | Password | Rol | Descripción | Acceso ABAC |
|-------|----------|-----|-------------|-------------|
| manager@example.com | manager123 | MANAGER | Gerente del sistema | ✅ Ve todos los datos + campos sensibles<br/>✅ Puede crear, actualizar y eliminar usuarios<br/>✅ Acceso completo a payrolls y roles |
| admin@example.com | admin123 | ADMIN | Administrador | ✅ Ve todos los datos + campos sensibles<br/>✅ Puede crear, actualizar y eliminar usuarios<br/>✅ Acceso completo a payrolls y roles |
| user@example.com | user123 | USER | Usuario regular | ✅ Solo ve sus propios datos<br/>❌ No puede ver datos de otros usuarios<br/>❌ No puede crear, actualizar o eliminar |

### Ejemplos de Filtrado ABAC

#### **MANAGER** - Acceso Completo
```json
// GET /users
{
  "users": [
    {
      "id": "uuid-1",
      "email": "admin@example.com",
      "salary": 75000,        // ← Campo sensible visible
      "password": "hashed",   // ← Campo sensible visible
      "role": "ADMIN"
    },
    {
      "id": "uuid-2", 
      "email": "user@example.com",
      "salary": 45000,        // ← Campo sensible visible
      "password": "hashed",   // ← Campo sensible visible
      "role": "USER"
    }
  ]
}
```

#### **ADMIN** - Acceso Completo (con passwords visibles)
```json
// GET /users
{
  "users": [
    {
      "id": "uuid-1",
      "email": "manager@example.com",
      "salary": 75000,        // ← Campo sensible visible
      "password": "hashed",   // ← Campo sensible visible
      "role": "MANAGER"
    },
    {
      "id": "uuid-2",
      "email": "user@example.com",
      "salary": 45000,        // ← Campo sensible visible
      "password": "hashed",   // ← Campo sensible visible
      "role": "USER"
    }
  ]
}

// GET /payrolls (ABAC REAL - sin campo salary)
{
  "payrolls": [
    {
      "id": "uuid-1",
      "userId": "uuid-2",
      "period": "2024-02"
      // ← salary filtrado por ABAC real
    }
  ]
}
```

#### **USER** - Solo Propios Datos
```json
// GET /users (usuario user@example.com)
{
  "users": [
    {
      "id": "uuid-2",
      "email": "user@example.com",
      "role": "USER"
      // ← Solo ve sus propios datos
    }
  ]
}
```

### Ejecutar Tests

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 🐳 Docker

### Docker Compose

El proyecto incluye configuración Docker Compose para desarrollo:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: volsmart_challenge
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      DATABASE_NAME: volsmart_challenge
```

### Comandos Docker

```bash
# Levantar todo el stack
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Rebuild
docker-compose up --build
```

## 📊 Base de Datos

### Esquema Principal

```sql
-- Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  salary DECIMAL,
  role_id UUID REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Roles (con campo type para ABAC)
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (type IN ('ADMIN', 'MANAGER', 'USER')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nóminas
CREATE TABLE payrolls (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL NOT NULL,
  period VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Configuración ABAC en Base de Datos

> **🔧 Configuración Dinámica**: El sistema ABAC utiliza tablas especializadas en la base de datos para almacenar toda la configuración de permisos, reglas de filtrado y políticas de acceso. Esto permite:

- **Modificaciones en tiempo real** sin reiniciar la aplicación
- **Configuración granular** por recurso y operación
- **Auditoría completa** de cambios en políticas de seguridad
- **Escalabilidad** para múltiples entornos (desarrollo, staging, producción)

### Scripts de Base de Datos

Los scripts de inicialización se encuentran en `db/`:

- `init-complete.sql`: Esquema completo con datos de prueba y configuración ABAC
- `init-db.sql`: Esquema base
- `init-abac.sql`: Configuración ABAC
- `03-optimize-abac.sql`: Optimizaciones

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Iniciar en modo desarrollo
npm run start:debug        # Iniciar con debug

# Producción
npm run build              # Compilar TypeScript
npm run start:prod         # Iniciar en modo producción

# Testing
npm run test               # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Coverage
npm run test:e2e           # Tests e2e

# Linting
npm run lint               # ESLint
npm run lint:fix           # Fix automático

# Base de datos
npm run migration:generate # Generar migración
npm run migration:run      # Ejecutar migraciones
npm run migration:revert   # Revertir migración
```

## 🏛️ Patrones de Diseño Implementados

### 1. Repository Pattern
- Abstracción de acceso a datos
- Fácil testing y mantenimiento

### 2. Dependency Injection
- Inversión de control
- Acoplamiento bajo

### 3. Decorator Pattern
- `@UseABAC()` para control de acceso
- `@Roles()` para autorización basada en roles


## 🔍 Logging y Monitoreo

El sistema incluye logging estructurado con diferentes niveles:

```typescript
// Ejemplo de uso
this.logger.info('OPERATION_NAME', LOG_LEVEL.INIT, 'Mensaje descriptivo', { context });
this.logger.logError('OPERATION_NAME', LOG_LEVEL.ERROR, error, { context });
```

### Niveles de Log

- `INIT`: Inicio de operación
- `SUCCESS`: Operación exitosa
- `ERROR`: Error en operación
- `INFO`: Información general



---

**Desarrollado con ❤️ usando NestJS, TypeScript y Clean Architecture**