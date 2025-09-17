import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../infraestructure/postgress/entities/user.entity';
import { UserRepositoryPort } from '../core/ports/user.repository.port';
import { UserModel } from '../core/models/user.model';
import { LoggerCustomService, LOG_LEVEL } from '../core/services/logger-custom.service';

@Injectable()
export class UserRepositoryImpl implements UserRepositoryPort {
  private readonly logger: LoggerCustomService = new LoggerCustomService(UserRepositoryImpl.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  private toModel(entity: UserEntity): UserModel {
    const { roles, passwordForTesting, ...userData } = entity;
    return {
      ...userData,
      passwordForTesting,
      roles: roles?.map(role => ({ ...role })) || [],
    };
  }

  private toEntity(model: UserModel): UserEntity {
    const { roles, ...userData } = model;
    return {
      ...new UserEntity(),
      ...userData,
      roles: roles?.map(role => ({ id: role.id } as any)) || [],
    };
  }

  async findById(id: string): Promise<UserModel | null> {
    this.logger.info('FIND_BY_ID', LOG_LEVEL.INIT, 'Finding user by ID in repository', { id });
    
    try {
      const entity = await this.userRepo.findOne({ 
        where: { id },
        relations: ['roles']
      });
      const found = !!entity;

      this.logger.info('FIND_BY_ID', LOG_LEVEL.SUCCESS, 'User found by ID in repository', { id, found });

      return entity ? this.toModel(entity) : null;
    } catch (error) {
      this.logger.logError('FIND_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    this.logger.info('FIND_BY_EMAIL', LOG_LEVEL.INIT, 'Finding user by email in repository', { email });
    
    try {
      const entity = await this.userRepo.findOne({ 
        where: { email },
        relations: ['roles']
      });
      const found = !!entity;

      this.logger.info('FIND_BY_EMAIL', LOG_LEVEL.SUCCESS, 'User found by email in repository', { email, found });

      return entity ? this.toModel(entity) : null;
    } catch (error) {
      this.logger.logError('FIND_BY_EMAIL', LOG_LEVEL.ERROR, error as Error, { email });
      throw error;
    }
  }

  async findAll(): Promise<UserModel[]> {
    this.logger.info('GET_ALL_USERS', LOG_LEVEL.INIT, 'Finding all users in repository');
    
    try {
      const entities = await this.userRepo.find({
        relations: ['roles']
      });

      const users = entities.map(entity => this.toModel(entity));

      this.logger.info('GET_ALL_USERS', LOG_LEVEL.SUCCESS, 'All users found in repository', { count: users.length });

      return users;
    } catch (error) {
      this.logger.logError('GET_ALL_USERS', LOG_LEVEL.ERROR, error as Error);
      throw error;
    }
  }

  async save(user: UserModel): Promise<UserModel> {
    this.logger.info('CREATE_USER', LOG_LEVEL.INIT, 'Saving user in repository', { 
      id: user.id, 
      email: user.email 
    });
    
    try {
      const entity = this.toEntity(user);

      const saved = await this.userRepo.save(entity);

      // Reload the user with roles to get complete role information
      const userWithRoles = await this.userRepo.findOne({ 
        where: { id: saved.id },
        relations: ['roles']
      });

      const savedUser = userWithRoles ? this.toModel(userWithRoles) : this.toModel(saved);

      this.logger.info('CREATE_USER', LOG_LEVEL.SUCCESS, 'User saved in repository', { 
        id: savedUser.id, 
        email: savedUser.email 
      });

      return savedUser;
    } catch (error) {
      this.logger.logError('CREATE_USER', LOG_LEVEL.ERROR, error as Error, { 
        id: user.id, 
        email: user.email 
      });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.logger.info('DELETE_USER', LOG_LEVEL.INIT, 'Deleting user in repository', { id });
    
    try {
      const result = await this.userRepo.delete(id);

      const deleted = (result.affected ?? 0) > 0;

      this.logger.info('DELETE_USER', LOG_LEVEL.SUCCESS, 'User deletion completed in repository', { id, deleted });

      return deleted;
    } catch (error) {
      this.logger.logError('DELETE_USER', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }
}
