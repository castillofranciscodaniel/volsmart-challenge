import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ABACService } from '../../core/services/abac.service';
import { UserModel } from '../../core/models/user.model';
import { PermissionType } from '../../core/constants/permission.types';

@Injectable()
export class ABACUnifiedInterceptor implements NestInterceptor {
  constructor(private readonly abacService: ABACService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user: UserModel = request.user;
    const body = request.body;
    const method = request.method;

    console.log('ABAC Unified Interceptor - Starting:', {
      url: request.url,
      method: method,
      hasUser: !!user,
      hasBody: !!body,
      userRoles: user?.roles?.map(r => r.name)
    });

    // Si no hay usuario autenticado, continuar sin filtrar
    if (!user) {
      console.log('ABAC Unified Interceptor - No user, continuing');
      return next.handle();
    }

    // 1. FILTRAR ENTRADA (POST, PUT, PATCH) - DELETE no tiene body
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const resourceInfo = this.getResourceFromPath(request.url, method);
      
      if (resourceInfo) {
        console.log('ABAC Unified Interceptor - Filtering input:', resourceInfo);
        
        try {
          const filteredBody = await this.filterInputByRole(
            resourceInfo.resourceName,
            body,
            user,
            resourceInfo.operation
          );
          
          console.log('ABAC Unified Interceptor - Input filtered:', {
            originalBody: body,
            filteredBody: filteredBody
          });
          
          // Actualizar el body de la request con el filtrado
          request.body = filteredBody;
        } catch (error) {
          console.error('ABAC Unified Interceptor - Error filtering input:', error);
          // En caso de error, continuar con el body original
        }
      }
    }

    // 2. VERIFICAR PERMISOS PARA DELETE (sin body)
    if (method === 'DELETE') {
      const resourceInfo = this.getResourceFromPath(request.url, method);
      
      if (resourceInfo) {
        console.log('ABAC Unified Interceptor - Checking DELETE permissions:', resourceInfo);
        
        try {
          const hasPermission = await this.abacService.canAccessResource(
            user.roles[0].name,
            resourceInfo.resourceName,
            'delete'
          );
          
          if (!hasPermission) {
            console.log('ABAC Unified Interceptor - No DELETE permission:', {
              role: user.roles[0].name,
              resource: resourceInfo.resourceName
            });
            throw new Error(`Insufficient permissions for DELETE operation on ${resourceInfo.resourceName}`);
          }
          
          console.log('ABAC Unified Interceptor - DELETE permission granted');
        } catch (error) {
          console.error('ABAC Unified Interceptor - Error checking DELETE permissions:', error);
          throw error;
        }
      }
    }

    // 3. FILTRAR SALIDA (GET, POST, PUT, DELETE)
    return next.handle().pipe(
      switchMap(data => this.filterResponseByRole(data, user, request))
    );
  }

  private async filterInputByRole(
    resourceName: string,
    inputData: any,
    requestingUser: UserModel,
    operation: 'write' | 'delete'
  ): Promise<any> {
    console.log('ABAC Unified - Filtering input by role:', { 
      resourceName, 
      operation,
      userId: requestingUser.id, 
      roles: requestingUser.roles.map(r => r.name)
    });
    
    try {
      // 1. Verificar si el usuario tiene permisos para la operación
      const hasPermission = await this.abacService.canAccessResource(
        requestingUser.roles[0].name, // Usar el primer rol
        resourceName,
        operation
      );

      if (!hasPermission) {
        console.log('ABAC Unified - No permission for operation:', { 
          resourceName,
          operation,
          roles: requestingUser.roles.map(r => r.name)
        });
        throw new Error(`Insufficient permissions for ${operation} operation on ${resourceName}`);
      }

      // 2. Obtener el recurso con sus permisos
      const resource = await this.abacService['abacRepo'].getResourceByName(resourceName);
      
      if (!resource || !resource.rolePermissions) {
        console.log('ABAC Unified - No resource or permissions found:', { resourceName });
        return inputData;
      }

      // 3. Obtener el mejor permiso del usuario
      let bestPermission: any = null;
      
      for (const role of requestingUser.roles) {
        const rolePermission = resource.rolePermissions[role.name];
        if (rolePermission && rolePermission.canWrite !== PermissionType.BLOCKED) {
          if (rolePermission.canWrite === PermissionType.FULL) {
            bestPermission = rolePermission;
            break;
          }
          if (!bestPermission || 
              (rolePermission.canWrite === PermissionType.PARTIAL && bestPermission.canWrite !== PermissionType.FULL)) {
            bestPermission = rolePermission;
          }
        }
      }

      if (!bestPermission) {
        console.log('ABAC Unified - No write permission for any role:', { 
          roles: requestingUser.roles.map(r => r.name), 
          resourceName 
        });
        throw new Error(`No write permissions for ${resourceName}`);
      }

      // 4. Si tiene acceso completo de lectura, devolver todos los datos
      if (bestPermission.canRead === PermissionType.FULL) {
        console.log('ABAC Unified - Full read access granted for input:', { 
          resourceName, 
          roles: requestingUser.roles.map(r => r.name)
        });
        return inputData;
      }

      // 5. Si es acceso parcial de lectura, filtrar campos sensibles del input
      if (bestPermission.canRead === PermissionType.PARTIAL) {
        console.log('ABAC Unified - Partial read access, filtering sensitive fields from input:', { 
          resourceName, 
          roles: requestingUser.roles.map(r => r.name)
        });

        const sensitiveFields = this.getSensitiveFieldsByResource(resourceName);
        const filteredInput = this.filterSensitiveFields(inputData, sensitiveFields);
        
        console.log('ABAC Unified - Input filtered by sensitive fields:', { 
          resourceName, 
          sensitiveFields: Array.from(sensitiveFields),
          originalKeys: Object.keys(inputData),
          filteredKeys: Object.keys(filteredInput)
        });
        
        return filteredInput;
      }

      // 6. Si es acceso self, verificar que el usuario solo modifique sus propios datos
      if (bestPermission.canWrite === PermissionType.SELF) {
        console.log('ABAC Unified - Self access, verifying user can only modify own data:', { 
          resourceName, 
          userId: requestingUser.id,
          roles: requestingUser.roles.map(r => r.name)
        });

        // Para operaciones self, verificar que el ID del recurso coincida con el usuario
        if (inputData.userId && inputData.userId !== requestingUser.id) {
          throw new Error('Cannot modify data for other users');
        }
        if (inputData.id && inputData.id !== requestingUser.id) {
          throw new Error('Cannot modify data for other users');
        }

        return inputData;
      }

      return inputData;
    } catch (error) {
      console.error('ABAC Unified - Error filtering input by role:', error);
      throw error;
    }
  }

  private async filterResponseByRole(data: any, user: UserModel, request: any): Promise<any> {
    // Determinar el recurso basado en la ruta
    const resourceName = this.getResourceFromPath(request.url, request.method)?.resourceName;
    
    console.log('ABAC Unified - Filtering response:', {
      url: request.url,
      resourceName,
      dataType: typeof data,
      isArray: Array.isArray(data),
      data: data
    });
    
    if (!resourceName) {
      console.log('ABAC Unified - No resource found for response, returning original data');
      return data;
    }

    // Si es un array, filtrar cada elemento
    if (Array.isArray(data)) {
      const result = await this.abacService.filterResourceByRole(resourceName, data, user);
      console.log('ABAC Unified - Array response filtered:', result);
      return result;
    }

    // Si es un objeto único, filtrar sus propiedades
    if (typeof data === 'object' && data !== null) {
      const filteredArray = await this.abacService.filterResourceByRole(resourceName, [data], user);
      const result = filteredArray.length > 0 ? filteredArray[0] : data;
      console.log('ABAC Unified - Object response filtered:', result);
      return result;
    }

    console.log('ABAC Unified - Returning original response data (not object/array)');
    return data;
  }

  private getResourceFromPath(path: string, method: string): { resourceName: string; operation: 'write' | 'delete' } | null {
    // Mapear rutas a recursos
    const pathToResource: { [key: string]: string } = {
      '/users': 'users',
      '/roles': 'roles',
      '/payrolls': 'payrolls',
    };

    // Buscar coincidencia exacta o por prefijo
    for (const [pathPattern, resource] of Object.entries(pathToResource)) {
      if (path.startsWith(pathPattern)) {
        // Determinar la operación basada en el método HTTP
        let operation: 'write' | 'delete';
        if (method === 'DELETE') {
          operation = 'delete';
        } else if (['POST', 'PUT', 'PATCH'].includes(method)) {
          operation = 'write';
        } else {
          operation = 'write'; // Para GET también usamos write para el filtrado de respuesta
        }

        return { resourceName: resource, operation };
      }
    }

    return null;
  }

  private getSensitiveFieldsByResource(resourceName: string): Set<string> {
    const sensitiveFieldsMap: { [key: string]: string[] } = {
      'users': ['password', 'passwordForTesting', 'salary'],
      'payrolls': ['amount', 'bonus', 'deductions'],
      'roles': []
    };

    return new Set(sensitiveFieldsMap[resourceName] || []);
  }

  private filterSensitiveFields(data: any, sensitiveFields: Set<string>): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const filtered = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in filtered) {
        delete filtered[field];
      }
    }

    return filtered;
  }
}
