import { PermissionLevel } from '../constants/permission.types';

export class ResourceModel {
  id: string;
  name: string;
  tableName: string;
  description?: string;
  rolePermissions?: {
    [roleName: string]: {
      canRead: PermissionLevel;
      canWrite: PermissionLevel;
      canDelete: PermissionLevel;
    }
  };
}

export class AttributeModel {
  id: string;
  name: string;
  fieldName: string;
  description?: string;
  isSensitive: boolean;
  resourceId: string;
}


