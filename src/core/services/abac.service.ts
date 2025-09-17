import { Injectable, Inject } from '@nestjs/common';
import { UserModel } from '../models/user.model';
import { ABAC_REPOSITORY } from '../ports/abac.repository.port';
import type { ABACRepositoryPort } from '../ports/abac.repository.port';
import { LoggerCustomService, LOG_LEVEL } from './logger-custom.service';
import { PermissionLevel, PermissionType } from '../constants/permission.types';

export interface ResourcePermission {
  canRead: PermissionLevel;
  canWrite: PermissionLevel;
  canDelete: PermissionLevel;
}

@Injectable()
export class ABACService {
  private readonly logger: LoggerCustomService = new LoggerCustomService(ABACService.name);

  constructor(@Inject(ABAC_REPOSITORY) private readonly abacRepo: ABACRepositoryPort) {}

  /**
   * Verifica si un rol tiene acceso a un recurso específico
   */
  async canAccessResource(
    roleName: string, 
    resourceName: string, 
    operation: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    this.logger.info('CAN_ACCESS_RESOURCE', LOG_LEVEL.INIT, 'Checking resource access', { 
      roleName, 
      resourceName, 
      operation 
    });

    try {
      // 1. Obtener el recurso con sus permisos de rol
      const resource = await this.abacRepo.getResourceByName(resourceName);
      
      if (!resource || !resource.rolePermissions) {
        this.logger.info('CAN_ACCESS_RESOURCE', LOG_LEVEL.INFO, 'No resource or permissions found', { 
          resourceName, 
          hasResource: !!resource, 
          hasPermissions: !!resource?.rolePermissions 
        });

        return false;
      }

      const rolePermission = resource.rolePermissions[roleName];
      
      if (!rolePermission) {
        this.logger.info('CAN_ACCESS_RESOURCE', LOG_LEVEL.INFO, 'No permission found for role', { 
          roleName, 
          resourceName 
        });

        return false;
      }

      // 2. Verificar el permiso específico
      let hasPermission = false;
      switch (operation) {
        case 'read':
          hasPermission = rolePermission.canRead !== PermissionType.BLOCKED;
          break;
        case 'write':
          hasPermission = rolePermission.canWrite !== PermissionType.BLOCKED;
          break;
        case 'delete':
          hasPermission = rolePermission.canDelete !== PermissionType.BLOCKED;
          break;
      }

      this.logger.info('CAN_ACCESS_RESOURCE', LOG_LEVEL.SUCCESS, 'Resource access check completed', { 
        roleName, 
        resourceName, 
        operation, 
        hasPermission,
      });

      return hasPermission;
    } catch (error) {
      this.logger.logError('CAN_ACCESS_RESOURCE', LOG_LEVEL.ERROR, error as Error, { 
        roleName, 
        resourceName, 
        operation 
      });
      throw error;
    }
  }

  /**
   * Filtra datos de recurso basado en permisos de rol
   * Optimizado: usa permisos de recurso primero, luego atributos si es necesario
   */
  async filterResourceByRole(
    resourceName: string, 
    data: any[], 
    requestingUser: UserModel
  ): Promise<any[]> {
    this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INIT, 'Filtering resource by role (optimized)', { 
      resourceName, 
      dataCount: data.length, 
      userId: requestingUser.id, 
      roles: requestingUser.roles.map(r => r.name)
    });
    
    try {
      // 1. Obtener el recurso con sus permisos
      const resource = await this.abacRepo.getResourceByName(resourceName);
      
      this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INFO, 'Resource retrieved', { 
        resourceName,
        resourceFound: !!resource,
        hasRolePermissions: !!(resource?.rolePermissions),
        rolePermissions: resource?.rolePermissions
      });
      
      if (!resource || !resource.rolePermissions) {
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INFO, 'No resource or permissions found, returning empty', { 
          resourceName 
        });

        return data.map(() => ({}));
      }

      // 2. Verificar si alguno de los roles del usuario tiene permisos
      let hasPermission = false;
      let bestPermission: ResourcePermission | null = null;
      
      for (const role of requestingUser.roles) {
        const rolePermission = resource.rolePermissions[role.name];
        if (rolePermission && rolePermission.canRead !== PermissionType.BLOCKED) {
          hasPermission = true;
          // Si tiene acceso completo de lectura, es el mejor permiso
          if (rolePermission.canRead === PermissionType.FULL) {
            bestPermission = rolePermission;
            break;
          }
          // Si no hay mejor permiso o este es mejor (full > partial > blocked)
          if (!bestPermission || 
              (rolePermission.canRead === PermissionType.PARTIAL && bestPermission.canRead !== PermissionType.FULL)) {
            bestPermission = rolePermission;
          }
        }
      }
      
      if (!hasPermission || !bestPermission) {
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INFO, 'No read permission for any role', { 
          roles: requestingUser.roles.map(r => r.name), 
          resourceName 
        });

        return data.map(() => ({}));
      }

      // 3. Si tiene acceso completo de lectura, devolver todos los datos
      if (bestPermission.canRead === PermissionType.FULL) {
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.SUCCESS, 'Full read access granted, returning all data', { 
          resourceName, 
          roles: requestingUser.roles.map(r => r.name)
        });

        return data;
      }

      // 4. Si es acceso parcial de lectura, filtrar campos sensibles
      if (bestPermission.canRead === PermissionType.PARTIAL) {
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INFO, 'Partial read access, filtering sensitive fields', { 
          resourceName, 
          roles: requestingUser.roles.map(r => r.name)
        });

        // Para acceso parcial, excluir campos sensibles
        const sensitiveFields = this.getSensitiveFieldsByResource(resourceName);
        const filteredData = data.map(item => this.filterSensitiveFields(item, sensitiveFields));
        
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.SUCCESS, 'Resource filtered by sensitive fields', { 
          resourceName, 
          originalCount: data.length, 
          filteredCount: filteredData.length,
          sensitiveFields: Array.from(sensitiveFields)
        });
        
        return filteredData;
      }

      // 5. Si es acceso self, filtrar solo datos del usuario actual
      if (bestPermission.canRead === PermissionType.SELF) {
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INFO, 'Self access, filtering own data only', { 
          resourceName, 
          userId: requestingUser.id,
          roles: requestingUser.roles.map(r => r.name)
        });

        // Filtrar solo los datos del usuario actual
        const filteredData = data.filter(item => this.isOwnData(item, requestingUser, resourceName));
        
        this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.SUCCESS, 'Resource filtered to own data', { 
          resourceName, 
          originalCount: data.length, 
          filteredCount: filteredData.length,
          userId: requestingUser.id
        });
        
        return filteredData;
      }

      // Si llegamos aquí, no hay permisos válidos
      this.logger.info('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.INFO, 'No valid access type found', { 
        resourceName, 
        roles: requestingUser.roles.map(r => r.name)
      });
      
      return data.map(() => ({}));
    } catch (error) {
      this.logger.logError('FILTER_RESOURCE_BY_ROLE', LOG_LEVEL.ERROR, error as Error, { 
        resourceName, 
        userId: requestingUser.id 
      });
      throw error;
    }
  }

  /**
   * Verifica si puede modificar un atributo específico
   * Solo se ejecuta si el acceso es parcial
   */
  async canModifyAttribute(
    roleName: string,
    resourceName: string, 
    attributeName: string
  ): Promise<boolean> {
    this.logger.info('CAN_MODIFY_ATTRIBUTE', LOG_LEVEL.INIT, 'Checking attribute modify permission', { 
      roleName, 
      resourceName, 
      attributeName 
    });
    
    try {
      // 1. Verificar acceso general al recurso
      const canWriteResource = await this.canAccessResource(roleName, resourceName, 'write');
      
      if (!canWriteResource) {
        this.logger.info('CAN_MODIFY_ATTRIBUTE', LOG_LEVEL.INFO, 'No write access to resource', { 
          roleName, 
          resourceName 
        });

        return false;
      }

      // 2. Obtener el recurso para verificar el tipo de acceso
      const resource = await this.abacRepo.getResourceByName(resourceName);
      
      if (!resource || !resource.rolePermissions) {
        return false;
      }

      const rolePermission = resource.rolePermissions[roleName];
      
      // 3. Si tiene acceso completo de escritura, puede modificar cualquier atributo
      if (rolePermission.canWrite === PermissionType.FULL) {
        this.logger.info('CAN_MODIFY_ATTRIBUTE', LOG_LEVEL.SUCCESS, 'Full access, can modify any attribute', { 
          roleName, 
          resourceName, 
          attributeName 
        });

        return true;
      }

      // 4. Si es acceso parcial, verificar el atributo específico
      // Para acceso parcial, asumimos que puede modificar si tiene write access al recurso
      // En una implementación más compleja, aquí se verificarían permisos específicos por atributo
      const canModify = rolePermission.canWrite !== PermissionType.BLOCKED;
      
      this.logger.info('CAN_MODIFY_ATTRIBUTE', LOG_LEVEL.SUCCESS, 'Attribute modify permission check completed', { 
        roleName, 
        resourceName, 
        attributeName, 
        canModify 
      });
      
      return canModify;
    } catch (error) {
      this.logger.logError('CAN_MODIFY_ATTRIBUTE', LOG_LEVEL.ERROR, error as Error, { 
        roleName, 
        resourceName, 
        attributeName 
      });
      throw error;
    }
  }

  private filterItemByAttributes(item: any, allowedAttributes: Set<string>): any {
    const filtered: any = {};
    
    Object.keys(item).forEach(key => {
      if (allowedAttributes.has(key)) {
        filtered[key] = item[key];
      }
    });
    
    return filtered;
  }

  private getSensitiveFieldsByResource(resourceName: string): Set<string> {
    const sensitiveFieldsMap: { [key: string]: string[] } = {
      'users': ['salary', 'password'],
      'payrolls': ['salary', 'amount'],
      'roles': [] // No hay campos sensibles en roles
    };
    
    return new Set(sensitiveFieldsMap[resourceName] || []);
  }

  private filterSensitiveFields(item: any, sensitiveFields: Set<string>): any {
    const filtered: any = {};
    
    Object.keys(item).forEach(key => {
      if (!sensitiveFields.has(key)) {
        filtered[key] = item[key];
      }
    });
    
    return filtered;
  }

  private isOwnData(item: any, user: UserModel, resourceName: string): boolean {
    // Para users: verificar si el item.id coincide con user.id
    if (resourceName === 'users') {
      return item.id === user.id;
    }
    
    // Para payrolls: verificar si el item.userId coincide con user.id
    if (resourceName === 'payrolls') {
      return item.userId === user.id || item.user_id === user.id;
    }
    
    // Para otros recursos, por defecto no permitir acceso
    return false;
  }

  /**
   * Filtra datos de entrada (POST, PUT) basado en permisos de rol
   */
  async filterInputByRole(
    resourceName: string,
    inputData: any,
    requestingUser: UserModel,
    operation: 'write' | 'delete'
  ): Promise<any> {
    this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.INIT, 'Filtering input data by role', { 
      resourceName, 
      operation,
      userId: requestingUser.id, 
      roles: requestingUser.roles.map(r => r.name)
    });
    
    try {
      // 1. Verificar si el usuario tiene permisos para la operación
      const hasPermission = await this.canAccessResource(
        requestingUser.roles[0].name, // Usar el primer rol
        resourceName,
        operation
      );

      if (!hasPermission) {
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.INFO, 'No permission for operation', { 
          resourceName,
          operation,
          roles: requestingUser.roles.map(r => r.name)
        });
        throw new Error(`Insufficient permissions for ${operation} operation on ${resourceName}`);
      }

      // 2. Obtener el recurso con sus permisos
      const resource = await this.abacRepo.getResourceByName(resourceName);
      
      if (!resource || !resource.rolePermissions) {
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.INFO, 'No resource or permissions found', { 
          resourceName 
        });
        return inputData;
      }

      // 3. Obtener el mejor permiso del usuario
      let bestPermission: ResourcePermission | null = null;
      
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
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.INFO, 'No write permission for any role', { 
          roles: requestingUser.roles.map(r => r.name), 
          resourceName 
        });
        throw new Error(`No write permissions for ${resourceName}`);
      }

      // 4. Si tiene acceso completo de escritura, devolver todos los datos
      if (bestPermission.canWrite === PermissionType.FULL) {
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.SUCCESS, 'Full access granted, returning all input data', { 
          resourceName, 
          roles: requestingUser.roles.map(r => r.name)
        });
        return inputData;
      }

      // 5. Si es acceso parcial de escritura, filtrar campos sensibles del input
      if (bestPermission.canWrite === PermissionType.PARTIAL) {
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.INFO, 'Partial access, filtering sensitive fields from input', { 
          resourceName, 
          roles: requestingUser.roles.map(r => r.name)
        });

        const sensitiveFields = this.getSensitiveFieldsByResource(resourceName);
        const filteredInput = this.filterSensitiveFields(inputData, sensitiveFields);
        
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.SUCCESS, 'Input filtered by sensitive fields', { 
          resourceName, 
          sensitiveFields: Array.from(sensitiveFields),
          originalKeys: Object.keys(inputData),
          filteredKeys: Object.keys(filteredInput)
        });
        
        return filteredInput;
      }

      // 6. Si es acceso self, verificar que el usuario solo modifique sus propios datos
      if (bestPermission.canWrite === PermissionType.SELF) {
        this.logger.info('FILTER_INPUT_BY_ROLE', LOG_LEVEL.INFO, 'Self access, verifying user can only modify own data', { 
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
      this.logger.logError('FILTER_INPUT_BY_ROLE', LOG_LEVEL.ERROR, error as Error, { 
        resourceName,
        operation,
        userId: requestingUser.id
      });
      throw error;
    }
  }
}
