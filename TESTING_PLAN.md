# Plan de Pruebas Integral - Volsmart Challenge API

## 🎯 Objetivo
Verificar que todos los componentes de la API funcionen correctamente, incluyendo:
- Autenticación y autorización
- Sistema ABAC optimizado
- Relación muchos a muchos usuarios-roles
- Encriptación de contraseñas
- Filtrado de datos por permisos
- Jerarquía de roles basada en datos

## 📋 Preparación

### 1. Configuración del Entorno
```bash
# 1. Asegurar que Docker esté corriendo
docker ps

# 2. Levantar la base de datos
docker-compose up -d db

# 3. Verificar que la aplicación esté corriendo
npm run start:dev

# 4. Verificar que la base de datos esté inicializada
# Debería haber 3 usuarios y 3 roles en la BD
```

### 2. Configuración de Postman
1. Importar la colección `Volsmart-Challenge-API-Complete.postman_collection.json`
2. Configurar la variable `base_url` como `http://localhost:3000`
3. Las variables de token se llenarán automáticamente durante las pruebas

## 🧪 Fase 1: Autenticación y Tokens

### 1.1 Login de Usuarios
**Objetivo**: Verificar que el login funcione con contraseñas encriptadas y no encriptadas

| Usuario | Email | Password | Token Variable | Resultado Esperado |
|---------|-------|----------|----------------|-------------------|
| Manager | manager@example.com | manager123 | manager_token | ✅ Login exitoso, token generado |
| Admin | admin@example.com | admin123 | admin_token | ✅ Login exitoso, token generado |
| User | user@example.com | user123 | user_token | ✅ Login exitoso, token generado |

**Pasos**:
1. Ejecutar "Login - Manager" → Copiar token a variable `manager_token`
2. Ejecutar "Login - Admin" → Copiar token a variable `admin_token`
3. Ejecutar "Login - User" → Copiar token a variable `user_token`

**Verificaciones**:
- [ ] Todos los logins devuelven status 200
- [ ] Los tokens contienen información de roles
- [ ] Los tokens incluyen `roles` como array (no objeto único)

### 1.2 Validación de Tokens
**Objetivo**: Verificar que los tokens sean válidos y contengan la información correcta

**Pasos**:
1. Ejecutar "Get My Profile" con cada token
2. Verificar que devuelva la información del usuario correcto

**Verificaciones**:
- [ ] Manager token devuelve usuario con rol MANAGER
- [ ] Admin token devuelve usuario con rol ADMIN  
- [ ] User token devuelve usuario con rol USER
- [ ] Los roles vienen como array con información completa

## 🧪 Fase 2: Sistema de Roles y Jerarquía

### 2.1 Consulta de Roles
**Objetivo**: Verificar que se puedan consultar todos los roles

**Pasos**:
1. Ejecutar "Get All Roles" con token de Manager
2. Ejecutar "Get Role by ID" con diferentes IDs

**Verificaciones**:
- [ ] Se devuelven 3 roles: MANAGER, ADMIN, USER
- [ ] Cada rol tiene `hierarchyLevel`, `canCreateRoles`, `canModifyRoles`
- [ ] MANAGER tiene `hierarchyLevel: 3` (más alto)
- [ ] ADMIN tiene `hierarchyLevel: 2` (medio)
- [ ] USER tiene `hierarchyLevel: 1` (más bajo)

### 2.2 Creación de Roles
**Objetivo**: Verificar la jerarquía de roles basada en datos

**Pasos**:
1. Ejecutar "Create Role (Manager)" → Debería funcionar
2. Ejecutar "Create Role (Admin) - Should Fail" → Debería fallar

**Verificaciones**:
- [ ] Manager puede crear roles (status 201)
- [ ] Admin NO puede crear roles ADMIN (status 403)
- [ ] Los errores incluyen mensaje de permisos insuficientes

### 2.3 Modificación de Roles
**Objetivo**: Verificar permisos de modificación

**Pasos**:
1. Ejecutar "Update Role" con token de Manager
2. Intentar modificar roles con diferentes usuarios

**Verificaciones**:
- [ ] Manager puede modificar roles
- [ ] Los cambios se reflejan en la base de datos

## 🧪 Fase 3: Gestión de Usuarios

### 3.1 Consulta de Usuarios
**Objetivo**: Verificar el filtrado ABAC por roles

**Pasos**:
1. Ejecutar "Get All Users (Manager)" → Debería ver todos los usuarios
2. Ejecutar "Get All Users (Admin)" → Debería ver usuarios filtrados
3. Ejecutar "Get All Users (User) - Should Fail" → Debería fallar

**Verificaciones**:
- [ ] Manager ve todos los usuarios sin filtros
- [ ] Admin ve usuarios filtrados por ABAC
- [ ] User no puede acceder (status 403)
- [ ] Los usuarios incluyen array de roles

### 3.2 Creación de Usuarios
**Objetivo**: Verificar creación con encriptación de contraseñas

**Pasos**:
1. Ejecutar "Create User (Manager)"
2. Ejecutar "Create User (Admin)"
3. Verificar en BD que las contraseñas estén encriptadas

**Verificaciones**:
- [ ] Usuarios creados exitosamente (status 201)
- [ ] Contraseñas encriptadas en BD
- [ ] Campo `passwordForTesting` contiene contraseña original
- [ ] Roles asignados correctamente

### 3.3 Modificación y Eliminación con Filtrado ABAC
**Objetivo**: Verificar operaciones CRUD con filtrado de campos sensibles por rol

#### 3.3.1 Pruebas de UPDATE con Filtrado ABAC

**Escenario 1: MANAGER actualizando usuario**
- **Datos enviados**: `{"email": "newemail@test.com", "salary": 5000, "password": "newpass123"}`
- **Resultado esperado**: ✅ Todos los campos se actualizan (acceso completo)

**Escenario 2: ADMIN actualizando usuario**
- **Datos enviados**: `{"email": "adminupdate@test.com", "salary": 8000, "password": "adminpass123"}`
- **Resultado esperado**: ❌ Campos sensibles (`salary`, `password`) filtrados, solo `email` se actualiza

**Escenario 3: USER actualizando su propio perfil**
- **Datos enviados**: `{"email": "userupdate@test.com", "salary": 10000, "password": "userpass123"}`
- **Resultado esperado**: ❌ Solo puede actualizar campos no sensibles, campos sensibles filtrados

**Pasos**:
1. Crear usuario de prueba con MANAGER
2. Intentar actualizar con ADMIN (verificar filtrado)
3. Intentar actualizar con USER (verificar filtrado)
4. Verificar en BD qué campos realmente se actualizaron

**Verificaciones**:
- [ ] MANAGER: Puede actualizar todos los campos
- [ ] ADMIN: Solo puede actualizar campos no sensibles (email)
- [ ] USER: Solo puede actualizar campos no sensibles
- [ ] Campos sensibles filtrados no se guardan en BD
- [ ] Logs muestran filtrado ABAC en acción

#### 3.3.2 Pruebas de DELETE con Filtrado ABAC

**Escenario 1: MANAGER eliminando usuario**
- **Resultado esperado**: ✅ Puede eliminar cualquier usuario

**Escenario 2: ADMIN intentando eliminar usuario**
- **Resultado esperado**: ❌ No puede eliminar usuarios (permisos insuficientes)

**Escenario 3: USER intentando eliminar usuario**
- **Resultado esperado**: ❌ No puede eliminar usuarios (permisos insuficientes)

**Pasos**:
1. Crear usuario de prueba con MANAGER
2. Intentar eliminar con ADMIN (debería fallar)
3. Intentar eliminar con USER (debería fallar)
4. Eliminar con MANAGER (debería funcionar)

**Verificaciones**:
- [ ] MANAGER: Puede eliminar usuarios
- [ ] ADMIN: No puede eliminar usuarios (403 Forbidden)
- [ ] USER: No puede eliminar usuarios (403 Forbidden)
- [ ] Mensajes de error descriptivos
- [ ] Logs muestran verificación de permisos

## 🧪 Fase 4: Sistema de Payrolls

### 4.1 Consulta de Payrolls
**Objetivo**: Verificar que cada usuario vea solo sus payrolls

**Pasos**:
1. Ejecutar "Get Payrolls for User (Manager)"
2. Ejecutar "Get Payrolls for User (Admin)"
3. Ejecutar "Get Payrolls for User (User)"

**Verificaciones**:
- [ ] Cada usuario ve solo sus propios payrolls
- [ ] No hay payrolls cruzados entre usuarios
- [ ] Los datos están filtrados por ABAC

### 4.2 Creación de Payrolls con Filtrado ABAC
**Objetivo**: Verificar creación de payrolls con filtrado de campos sensibles

**Escenario 1: MANAGER creando payroll**
- **Datos enviados**: `{"userId": "user123", "period": "2024-01", "salary": 5000, "bonus": 1000, "deductions": 500}`
- **Resultado esperado**: ✅ Todos los campos se guardan (acceso completo)

**Escenario 2: ADMIN creando payroll**
- **Datos enviados**: `{"userId": "user123", "period": "2024-01", "salary": 5000, "bonus": 1000, "deductions": 500}`
- **Resultado esperado**: ❌ Campos sensibles (`amount`, `bonus`, `deductions`) filtrados

**Escenario 3: USER creando su propio payroll**
- **Datos enviados**: `{"userId": "self", "period": "2024-01", "salary": 5000, "bonus": 1000, "deductions": 500}`
- **Resultado esperado**: ❌ Solo puede crear payrolls para sí mismo, campos sensibles filtrados

**Pasos**:
1. Crear payroll con MANAGER (verificar acceso completo)
2. Crear payroll con ADMIN (verificar filtrado)
3. Crear payroll con USER (verificar restricciones)
4. Verificar en BD qué campos realmente se guardaron

**Verificaciones**:
- [ ] MANAGER: Puede crear payrolls con todos los campos
- [ ] ADMIN: Campos sensibles filtrados en creación
- [ ] USER: Solo puede crear payrolls para sí mismo
- [ ] Campos sensibles no se guardan en BD cuando están filtrados
- [ ] Logs muestran filtrado ABAC en creación

### 4.3 Modificación y Eliminación de Payrolls con Filtrado ABAC
**Objetivo**: Verificar operaciones CRUD en payrolls con filtrado por rol

#### 4.3.1 Pruebas de UPDATE de Payrolls

**Escenario 1: MANAGER actualizando payroll**
- **Resultado esperado**: ✅ Puede actualizar todos los campos

**Escenario 2: ADMIN actualizando payroll**
- **Resultado esperado**: ❌ Campos sensibles filtrados, solo campos básicos

**Escenario 3: USER actualizando su propio payroll**
- **Resultado esperado**: ❌ Solo puede actualizar sus propios payrolls, campos sensibles filtrados

#### 4.3.2 Pruebas de DELETE de Payrolls

**Escenario 1: MANAGER eliminando payroll**
- **Resultado esperado**: ✅ Puede eliminar cualquier payroll

**Escenario 2: ADMIN intentando eliminar payroll**
- **Resultado esperado**: ❌ No puede eliminar payrolls (permisos insuficientes)

**Escenario 3: USER intentando eliminar payroll**
- **Resultado esperado**: ❌ No puede eliminar payrolls (permisos insuficientes)

**Verificaciones**:
- [ ] MANAGER: Acceso completo a operaciones de payrolls
- [ ] ADMIN: Operaciones limitadas con filtrado de campos sensibles
- [ ] USER: Solo puede operar con sus propios payrolls
- [ ] Campos sensibles filtrados correctamente
- [ ] Logs muestran decisiones de ABAC

## 🧪 Fase 5: Sistema ABAC Optimizado

### 5.1 Filtrado por Recursos
**Objetivo**: Verificar el filtrado optimizado por recursos

**Pasos**:
1. Ejecutar "Test Resource Access - Manager" → Debería ver todos los usuarios
2. Ejecutar "Test Resource Access - Admin" → Debería ver usuarios filtrados
3. Ejecutar "Test Resource Access - User (Should be filtered)" → Debería ver solo su perfil

**Verificaciones**:
- [ ] Manager: Acceso completo a todos los recursos
- [ ] Admin: Acceso limitado según permisos
- [ ] User: Acceso muy limitado, solo sus propios datos

### 5.2 Verificación de Logs
**Objetivo**: Verificar que el logging funcione correctamente

**Pasos**:
1. Revisar logs de la aplicación durante las pruebas
2. Verificar que aparezcan logs de ABAC

**Verificaciones**:
- [ ] Logs de autenticación aparecen
- [ ] Logs de ABAC aparecen con decisiones de filtrado
- [ ] Logs de errores aparecen cuando corresponde

## 🧪 Fase 6: Escenarios de Error

### 6.1 Autenticación
**Objetivo**: Verificar manejo de errores de autenticación

**Pasos**:
1. Ejecutar "Login with Invalid Credentials"
2. Ejecutar "Access Protected Route Without Token"
3. Ejecutar "Access with Invalid Token"

**Verificaciones**:
- [ ] Credenciales inválidas → 401 Unauthorized
- [ ] Sin token → 401 Unauthorized
- [ ] Token inválido → 401 Unauthorized

### 6.2 Autorización
**Objetivo**: Verificar manejo de errores de autorización

**Pasos**:
1. Intentar crear usuario con email duplicado
2. Intentar acceder a recursos sin permisos

**Verificaciones**:
- [ ] Email duplicado → 400 Bad Request
- [ ] Sin permisos → 403 Forbidden
- [ ] Mensajes de error descriptivos

## 🧪 Fase 7: Verificación de Base de Datos

### 7.1 Estructura de Datos
**Objetivo**: Verificar que la estructura de la BD sea correcta

**Consultas SQL**:
```sql
-- Verificar usuarios y sus roles
SELECT u.email, r.name as role_name, r.hierarchy_level
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.email;

-- Verificar roles y sus permisos
SELECT name, hierarchy_level, can_create_roles, can_modify_roles
FROM roles
ORDER BY hierarchy_level DESC;

-- Verificar payrolls
SELECT p.period, p.salary, u.email
FROM payrolls p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
```

**Verificaciones**:
- [ ] Relación muchos a muchos funciona correctamente
- [ ] Jerarquía de roles está bien definida
- [ ] Contraseñas están encriptadas
- [ ] Campo `passwordForTesting` contiene contraseñas originales

## 📊 Criterios de Éxito

### ✅ Funcionalidad
- [ ] Todos los endpoints responden correctamente
- [ ] Autenticación funciona con contraseñas encriptadas
- [ ] Sistema ABAC filtra datos correctamente
- [ ] Jerarquía de roles funciona basada en datos
- [ ] Relación muchos a muchos usuarios-roles funciona

### ✅ Seguridad
- [ ] Contraseñas están encriptadas en BD
- [ ] Tokens JWT contienen información correcta
- [ ] Permisos se respetan en todos los endpoints
- [ ] Filtrado ABAC previene acceso no autorizado

### ✅ Performance
- [ ] Respuestas rápidas (< 500ms)
- [ ] Sistema ABAC optimizado funciona
- [ ] Logs no impactan performance significativamente

## 🚨 Problemas Conocidos a Verificar

1. **Docker**: Asegurar que esté corriendo antes de las pruebas
2. **Puerto 3000**: Verificar que no esté ocupado
3. **Base de datos**: Verificar que se inicialice correctamente
4. **Tokens**: Verificar que se copien correctamente en variables de Postman

## 📝 Notas de Pruebas

- **Duración estimada**: 2-3 horas
- **Orden recomendado**: Seguir las fases en orden
- **Documentar**: Anotar cualquier comportamiento inesperado
- **Repetir**: Ejecutar pruebas críticas varias veces

## 🔄 Próximos Pasos

Después de completar las pruebas:
1. Documentar cualquier bug encontrado
2. Verificar cobertura de tests unitarios
3. Optimizar performance si es necesario
4. Preparar para deployment
