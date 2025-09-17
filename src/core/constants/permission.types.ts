export enum PermissionType {
  FULL = 'full',
  PARTIAL = 'partial',
  SELF = 'self',
  BLOCKED = 'blocked'
}

export type PermissionLevel = PermissionType.FULL | PermissionType.PARTIAL | PermissionType.SELF | PermissionType.BLOCKED;
