export enum RoleType {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export class RoleModel {
  id: string;
  name: string;
  description?: string;
  type: RoleType;
}

export class UserModel {
  id: string;
  email: string;
  password: string;
  passwordForTesting?: string;
  roles: RoleModel[];
  roleIds?: string[]; // For creating users with role assignments
  salary?: number;
}
