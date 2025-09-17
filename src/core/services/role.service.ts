import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../ports/role.repository.port';
import type { RoleRepositoryPort } from '../ports/role.repository.port';
import { RoleModel, RoleType } from '../models/user.model';
import { LoggerCustomService, LOG_LEVEL } from './logger-custom.service';

@Injectable()
export class RoleService {
  private readonly logger: LoggerCustomService = new LoggerCustomService(RoleService.name);

  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepo: RoleRepositoryPort,
  ) {}

  async findById(id: string): Promise<RoleModel | null> {
    this.logger.info('FIND_BY_ID', LOG_LEVEL.INIT, 'Finding role by ID', { id });
    
    try {
      const role = await this.roleRepo.findById(id);

      this.logger.info('FIND_BY_ID', LOG_LEVEL.SUCCESS, 'Role found by ID', { id, found: !!role });

      return role;
    } catch (error) {
      this.logger.logError('FIND_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async findByName(name: string): Promise<RoleModel | null> {
    this.logger.info('FIND_BY_NAME', LOG_LEVEL.INIT, 'Finding role by name', { name });
    
    try {
      const role = await this.roleRepo.findByName(name);

      this.logger.info('FIND_BY_NAME', LOG_LEVEL.SUCCESS, 'Role found by name', { name, found: !!role });

      return role;
    } catch (error) {
      this.logger.logError('FIND_BY_NAME', LOG_LEVEL.ERROR, error as Error, { name });
      throw error;
    }
  }

  async getAllRoles(): Promise<RoleModel[]> {
    this.logger.info('GET_ALL_ROLES', LOG_LEVEL.INIT, 'Getting all roles');
    
    try {
      const roles = await this.roleRepo.findAll();

      this.logger.info('GET_ALL_ROLES', LOG_LEVEL.SUCCESS, 'All roles retrieved', { count: roles.length });

      return roles;
    } catch (error) {
      this.logger.logError('GET_ALL_ROLES', LOG_LEVEL.ERROR, error as Error);
      throw error;
    }
  }

  async createRole(roleData: Partial<RoleModel>): Promise<RoleModel> {
    this.logger.info('CREATE_ROLE', LOG_LEVEL.INIT, 'Creating new role', { 
      name: roleData.name
    });
    
    try {
      const role = new RoleModel();
      Object.assign(role, roleData);

      const savedRole = await this.roleRepo.save(role);

      this.logger.info('CREATE_ROLE', LOG_LEVEL.SUCCESS, 'Role created successfully', { 
        id: savedRole.id, 
        name: savedRole.name 
      });

      return savedRole;
    } catch (error) {
      this.logger.logError('CREATE_ROLE', LOG_LEVEL.ERROR, error as Error, { name: roleData.name });
      throw error;
    }
  }

  async updateRole(id: string, roleData: Partial<RoleModel>): Promise<RoleModel | null> {
    this.logger.info('UPDATE_ROLE', LOG_LEVEL.INIT, 'Updating role', { 
      id, 
      updateData: roleData
    });
    
    try {
      const existingRole = await this.roleRepo.findById(id);

      if (!existingRole) {
        this.logger.info('UPDATE_ROLE', LOG_LEVEL.ERROR, 'Role not found for update', { id });
        return null;
      }
      
      Object.assign(existingRole, roleData);
      const updatedRole = await this.roleRepo.save(existingRole);

      this.logger.info('UPDATE_ROLE', LOG_LEVEL.SUCCESS, 'Role updated successfully', { 
        id: updatedRole.id, 
        name: updatedRole.name 
      });

      return updatedRole;
    } catch (error) {
      this.logger.logError('UPDATE_ROLE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async deleteRole(id: string): Promise<boolean> {
    this.logger.info('DELETE_ROLE', LOG_LEVEL.INIT, 'Deleting role', { id });
    
    try {
      const deleted = await this.roleRepo.delete(id);
      this.logger.info('DELETE_ROLE', LOG_LEVEL.SUCCESS, 'Role deletion completed', { id, deleted });

      return deleted;
    } catch (error) {
      this.logger.logError('DELETE_ROLE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }
}
