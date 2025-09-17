-- Script completo de inicialización de la base de datos
-- Unifica todos los scripts anteriores en uno solo

-- ==============================================
-- 1. CREAR TABLAS PRINCIPALES
-- ==============================================

-- Crear la tabla de roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" varchar NOT NULL UNIQUE,
    "description" varchar,
    "type" varchar(20) NOT NULL DEFAULT 'USER' CHECK ("type" IN ('ADMIN', 'MANAGER', 'USER'))
);

-- Crear la tabla de usuarios
CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" varchar NOT NULL UNIQUE,
    "password" varchar NOT NULL,
    "password_for_testing" varchar,
    "salary" float
);

-- Crear tabla de relación muchos a muchos entre usuarios y roles
CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id" uuid NOT NULL,
    "role_id" uuid NOT NULL,
    PRIMARY KEY ("user_id", "role_id"),
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
);

-- Crear la tabla de payrolls
CREATE TABLE IF NOT EXISTS "payrolls" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "salary" float NOT NULL,
    "period" varchar(20) NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

-- Crear tabla de recursos
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    description TEXT,
    role_permissions JSONB
);

-- Crear tabla de atributos
CREATE TABLE IF NOT EXISTS attributes (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    resource_id UUID NOT NULL,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- Crear tabla de permisos de rol
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY,
    role_id UUID NOT NULL,
    attribute_id UUID NOT NULL,
    can_read VARCHAR(10) DEFAULT 'blocked' CHECK (can_read IN ('full', 'partial', 'blocked')),
    can_write VARCHAR(10) DEFAULT 'blocked' CHECK (can_write IN ('full', 'partial', 'blocked')),
    can_delete VARCHAR(10) DEFAULT 'blocked' CHECK (can_delete IN ('full', 'partial', 'blocked')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
    UNIQUE(role_id, attribute_id)
);

-- ==============================================
-- 2. INSERTAR ROLES CON JERARQUÍA
-- ==============================================

-- Insertar roles con jerarquía basada en data
INSERT INTO "roles" ("id", "name", "description", "type") VALUES
('750e8400-e29b-41d4-a716-446655440001', 'MANAGER', 'Manager with highest privileges', 'MANAGER'),
('750e8400-e29b-41d4-a716-446655440002', 'ADMIN', 'Administrator with administrative access', 'ADMIN'),
('750e8400-e29b-41d4-a716-446655440003', 'USER', 'Regular user with basic access', 'USER')
ON CONFLICT ("id") DO NOTHING;

-- ==============================================
-- 3. INSERTAR USUARIOS DE PRUEBA
-- ==============================================

INSERT INTO "users" ("id", "email", "password", "password_for_testing", "salary") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'manager@example.com', 'manager123', 'manager123', 6000.00),
('550e8400-e29b-41d4-a716-446655440002', 'admin@example.com', 'admin123', 'admin123', 5000.00),
('550e8400-e29b-41d4-a716-446655440003', 'user@example.com', 'user123', 'user123', 3000.00)
ON CONFLICT ("id") DO NOTHING;

-- ==============================================
-- 3.1. ASIGNAR ROLES A USUARIOS
-- ==============================================

INSERT INTO "user_roles" ("user_id", "role_id") VALUES
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001'), -- Manager
('550e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002'), -- Admin
('550e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003')  -- User
ON CONFLICT ("user_id", "role_id") DO NOTHING;

-- ==============================================
-- 4. INSERTAR PAYROLLS DE PRUEBA
-- ==============================================

INSERT INTO "payrolls" ("id", "user_id", "salary", "period", "createdAt") VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 6000.00, '2024-01', '2024-01-01 00:00:00'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 5000.00, '2024-01', '2024-01-01 00:00:00'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 3000.00, '2024-01', '2024-01-01 00:00:00')
ON CONFLICT ("id") DO NOTHING;

-- ==============================================
-- 5. INSERTAR RECURSOS
-- ==============================================

INSERT INTO resources (id, name, table_name, description, role_permissions) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'users', 'users', 'User management resource', '{
  "MANAGER": {
    "canRead": "full",
    "canWrite": "full",
    "canDelete": "full"
  },
  "ADMIN": {
    "canRead": "full",
    "canWrite": "partial",
    "canDelete": "full"
  },
  "USER": {
    "canRead": "partial",
    "canWrite": "blocked",
    "canDelete": "blocked"
  }
}'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 'payrolls', 'payrolls', 'Payroll management resource', '{
  "MANAGER": {
    "canRead": "full",
    "canWrite": "full",
    "canDelete": "full"
  },
  "ADMIN": {
    "canRead": "partial",
    "canWrite": "partial",
    "canDelete": "full"
  },
  "USER": {
    "canRead": "partial",
    "canWrite": "blocked",
    "canDelete": "blocked"
  }
}'::jsonb),
('550e8400-e29b-41d4-a716-446655440003', 'roles', 'roles', 'Role management resource', '{
  "MANAGER": {
    "canRead": "full",
    "canWrite": "full",
    "canDelete": "full",
    "accessType": "full"
  },
  "ADMIN": {
    "canRead": "full",
    "canWrite": "partial",
    "canDelete": "full",
    "accessType": "partial"
  },
  "USER": {
    "canRead": "blocked",
    "canWrite": "blocked",
    "canDelete": "full",
    "accessType": "blocked"
  }
}'::jsonb);

-- ==============================================
-- 6. INSERTAR ATRIBUTOS
-- ==============================================

-- Atributos para el recurso 'users'
INSERT INTO attributes (id, name, field_name, description, is_sensitive, resource_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'User ID', 'id', 'Unique user identifier', false, '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440002', 'Email', 'email', 'User email address', false, '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440003', 'Salary', 'salary', 'User salary information', true, '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440004', 'Role', 'role', 'User role information', false, '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440005', 'Password', 'password', 'User password (never returned)', true, '550e8400-e29b-41d4-a716-446655440001');

-- Atributos para el recurso 'payrolls'
INSERT INTO attributes (id, name, field_name, description, is_sensitive, resource_id) VALUES
('660e8400-e29b-41d4-a716-446655440006', 'Payroll ID', 'id', 'Unique payroll identifier', false, '550e8400-e29b-41d4-a716-446655440002'),
('660e8400-e29b-41d4-a716-446655440007', 'Amount', 'salary', 'Payroll amount (sensitive)', true, '550e8400-e29b-41d4-a716-446655440002'),
('660e8400-e29b-41d4-a716-446655440008', 'Period', 'period', 'Payroll period', false, '550e8400-e29b-41d4-a716-446655440002'),
('660e8400-e29b-41d4-a716-446655440009', 'User ID', 'userId', 'Associated user ID', false, '550e8400-e29b-41d4-a716-446655440002'),
('660e8400-e29b-41d4-a716-446655440010', 'Created At', 'createdAt', 'Creation timestamp', false, '550e8400-e29b-41d4-a716-446655440002');

-- Atributos para el recurso 'roles'
INSERT INTO attributes (id, name, field_name, description, is_sensitive, resource_id) VALUES
('660e8400-e29b-41d4-a716-446655440011', 'Role ID', 'id', 'Unique role identifier', false, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440012', 'Role Name', 'name', 'Role name', false, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440013', 'Description', 'description', 'Role description', false, '550e8400-e29b-41d4-a716-446655440003'),
('660e8400-e29b-41d4-a716-446655440014', 'Hierarchy Level', 'hierarchyLevel', 'Role hierarchy level', false, '550e8400-e29b-41d4-a716-446655440003');

-- Atributos para el recurso 'reports'
INSERT INTO attributes (id, name, field_name, description, is_sensitive, resource_id) VALUES
('660e8400-e29b-41d4-a716-446655440015', 'Report ID', 'id', 'Unique report identifier', false, '550e8400-e29b-41d4-a716-446655440004'),
('660e8400-e29b-41d4-a716-446655440016', 'Title', 'title', 'Report title', false, '550e8400-e29b-41d4-a716-446655440004'),
('660e8400-e29b-41d4-a716-446655440017', 'Data', 'data', 'Report data (sensitive)', true, '550e8400-e29b-41d4-a716-446655440004'),
('660e8400-e29b-41d4-a716-446655440018', 'Created By', 'createdBy', 'Report creator', false, '550e8400-e29b-41d4-a716-446655440004');

-- ==============================================
-- 7. INSERTAR PERMISOS DE ROL
-- ==============================================

-- Permisos para MANAGER - puede ver todo
INSERT INTO role_permissions (id, role_id, attribute_id, can_read, can_write, can_delete) 
SELECT 
  gen_random_uuid(),
  r.id,
  a.id,
  'full', 'full', 'full'
FROM roles r
CROSS JOIN attributes a
WHERE r.name = 'MANAGER';

-- Permisos para ADMIN - puede ver todo excepto campos sensibles de otros roles
INSERT INTO role_permissions (id, role_id, attribute_id, can_read, can_write, can_delete) 
SELECT 
  gen_random_uuid(),
  r.id,
  a.id,
  'full', 
  CASE WHEN a.is_sensitive = false THEN 'partial' ELSE 'blocked' END,
  'blocked'
FROM roles r
CROSS JOIN attributes a
WHERE r.name = 'ADMIN';

-- Permisos para USER - solo puede ver información básica
INSERT INTO role_permissions (id, role_id, attribute_id, can_read, can_write, can_delete) 
SELECT 
  gen_random_uuid(),
  r.id,
  a.id,
  CASE WHEN a.field_name IN ('id', 'email', 'period', 'createdAt', 'title') AND a.is_sensitive = false THEN 'full' ELSE 'blocked' END,
  'blocked',
  'blocked'
FROM roles r
CROSS JOIN attributes a
WHERE r.name = 'USER';

-- ==============================================
-- 8. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name);
CREATE INDEX IF NOT EXISTS idx_resources_role_permissions ON resources USING GIN(role_permissions);
-- CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON roles(hierarchy_level); -- Removed because hierarchy_level column was removed
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_payrolls_user_id ON payrolls(user_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_period ON payrolls(period);
