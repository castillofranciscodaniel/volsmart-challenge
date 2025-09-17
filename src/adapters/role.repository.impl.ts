import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../infraestructure/postgress/entities/role.entity';
import { RoleRepositoryPort } from '../core/ports/role.repository.port';
import { RoleModel, RoleType } from '../core/models/user.model';
import { LoggerCustomService, LOG_LEVEL } from '../core/services/logger-custom.service';

@Injectable()
export class RoleRepositoryImpl implements RoleRepositoryPort {
  private readonly logger: LoggerCustomService = new LoggerCustomService(RoleRepositoryImpl.name);

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

  private toModel(entity: RoleEntity): RoleModel {
    return { ...entity };
  }

  private toEntity(model: RoleModel): RoleEntity {
    return { ...new RoleEntity(), ...model };
  }

  async findById(id: string): Promise<RoleModel | null> {
    this.logger.info('FIND_BY_ID', LOG_LEVEL.INIT, 'Finding role by ID in repository', { id });
    
    try {
      const entity = await this.roleRepo.findOne({ where: { id } });
      const found = !!entity;

      this.logger.info('FIND_BY_ID', LOG_LEVEL.SUCCESS, 'Role found by ID in repository', { id, found });

      return entity ? this.toModel(entity) : null;
    } catch (error) {
      this.logger.logError('FIND_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async findByName(name: string): Promise<RoleModel | null> {
    this.logger.info('FIND_BY_NAME', LOG_LEVEL.INIT, 'Finding role by name in repository', { name });
    
    try {
      const entity = await this.roleRepo.findOne({ where: { name } });
      const found = !!entity;

      this.logger.info('FIND_BY_NAME', LOG_LEVEL.SUCCESS, 'Role found by name in repository', { name, found });

      return entity ? this.toModel(entity) : null;
    } catch (error) {
      this.logger.logError('FIND_BY_NAME', LOG_LEVEL.ERROR, error as Error, { name });
      throw error;
    }
  }

  async findAll(): Promise<RoleModel[]> {
    this.logger.info('GET_ALL_ROLES', LOG_LEVEL.INIT, 'Finding all roles in repository');
    
    try {
      const entities = await this.roleRepo.find();
      const roles = entities.map(this.toModel);

      this.logger.info('GET_ALL_ROLES', LOG_LEVEL.SUCCESS, 'All roles found in repository', { count: roles.length });

      return roles;
    } catch (error) {
      this.logger.logError('GET_ALL_ROLES', LOG_LEVEL.ERROR, error as Error);
      throw error;
    }
  }

  async save(role: RoleModel): Promise<RoleModel> {
    this.logger.info('CREATE_ROLE', LOG_LEVEL.INIT, 'Saving role in repository', { 
      id: role.id, 
      name: role.name 
    });
    
    try {
      const entity = this.toEntity(role);
      const saved = await this.roleRepo.save(entity);
      const savedRole = this.toModel(saved);

      this.logger.info('CREATE_ROLE', LOG_LEVEL.SUCCESS, 'Role saved in repository', { 
        id: savedRole.id, 
        name: savedRole.name 
      });

      return savedRole;
    } catch (error) {
      this.logger.logError('CREATE_ROLE', LOG_LEVEL.ERROR, error as Error, { 
        id: role.id, 
        name: role.name 
      });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.logger.info('DELETE_ROLE', LOG_LEVEL.INIT, 'Deleting role in repository', { id });
    
    try {
      const result = await this.roleRepo.delete(id);
      const deleted = (result.affected ?? 0) > 0;

      this.logger.info('DELETE_ROLE', LOG_LEVEL.SUCCESS, 'Role deletion completed in repository', { id, deleted });

      return deleted;
    } catch (error) {
      this.logger.logError('DELETE_ROLE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }
}
