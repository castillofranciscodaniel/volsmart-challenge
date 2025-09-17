import { RoleModel } from '../models/user.model';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepositoryPort {
  findById(id: string): Promise<RoleModel | null>;
  findByName(name: string): Promise<RoleModel | null>;
  findAll(): Promise<RoleModel[]>;
  save(role: RoleModel): Promise<RoleModel>;
  delete(id: string): Promise<boolean>;
}
