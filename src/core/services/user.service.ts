import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import { UserModel, RoleType } from '../models/user.model';
import { LoggerCustomService, LOG_LEVEL } from './logger-custom.service';
import { EncryptionService } from './encryption.service';

@Injectable()
export class UserService {
  private readonly logger: LoggerCustomService = new LoggerCustomService(UserService.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findById(id: string): Promise<UserModel | null> {
    this.logger.info('FIND_BY_ID', LOG_LEVEL.INIT, 'Finding user by ID', { id });
    
    try {
      const user = await this.userRepo.findById(id);

      this.logger.info('FIND_BY_ID', LOG_LEVEL.SUCCESS, 'User found by ID', { id, found: !!user });

      return user;
    } catch (error) {
      this.logger.logError('FIND_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    this.logger.info('FIND_BY_EMAIL', LOG_LEVEL.INIT, 'Finding user by email', { email });
    
    try {
      const user = await this.userRepo.findByEmail(email);

      this.logger.info('FIND_BY_EMAIL', LOG_LEVEL.SUCCESS, 'User found by email', { email, found: !!user });

      return user;
    } catch (error) {
      this.logger.logError('FIND_BY_EMAIL', LOG_LEVEL.ERROR, error as Error, { email });
      throw error;
    }
  }

  async getAllUsers(): Promise<UserModel[]> {
    this.logger.info('GET_ALL_USERS', LOG_LEVEL.INIT, 'Getting all users');
    
    try {
      const users = await this.userRepo.findAll();

      this.logger.info('GET_ALL_USERS', LOG_LEVEL.SUCCESS, 'All users retrieved', { count: users.length });

      return users;
    } catch (error) {
      this.logger.logError('GET_ALL_USERS', LOG_LEVEL.ERROR, error as Error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserModel | null> {
    this.logger.info('GET_USER_BY_ID', LOG_LEVEL.INIT, 'Getting user by ID', { id });
    
    try {
      const user = await this.userRepo.findById(id);

      this.logger.info('GET_USER_BY_ID', LOG_LEVEL.SUCCESS, 'User retrieved by ID', { id, found: !!user });

      return user;
    } catch (error) {
      this.logger.logError('GET_USER_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async createUser(userData: Partial<UserModel>): Promise<UserModel> {
    this.logger.info('CREATE_USER', LOG_LEVEL.INIT, 'Creating new user', { email: userData.email });
    
    try {
      const user = new UserModel();
      Object.assign(user, userData);

      // Encrypt password if provided
      if (userData.password) {
        user.password = await this.encryptionService.hashPassword(userData.password);
        // Store original password for testing purposes
        user.passwordForTesting = userData.password;
      }

      // Handle role assignment if roleIds are provided
      if (userData.roleIds && userData.roleIds.length > 0) {
        // Convert roleIds to role objects
        user.roles = userData.roleIds.map(roleId => ({
          id: roleId,
          name: '', // Will be populated by the repository
          description: '',
          type: RoleType.USER // Default type, will be updated by repository
        }));
      }

      const savedUser = await this.userRepo.save(user);

      this.logger.info('CREATE_USER', LOG_LEVEL.SUCCESS, 'User created successfully', { 
        id: savedUser.id, 
        email: savedUser.email 
      });

      return savedUser;
    } catch (error) {
      this.logger.logError('CREATE_USER', LOG_LEVEL.ERROR, error as Error, { email: userData.email });
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<UserModel>): Promise<UserModel | null> {
    this.logger.info('UPDATE_USER', LOG_LEVEL.INIT, 'Updating user', { id, updateData: userData });
    
    try {
      const existingUser = await this.userRepo.findById(id);
      if (!existingUser) {
        this.logger.info('UPDATE_USER', LOG_LEVEL.ERROR, 'User not found for update', { id });

        return null;
      }
      
      Object.assign(existingUser, userData);
      const updatedUser = await this.userRepo.save(existingUser);

      this.logger.info('UPDATE_USER', LOG_LEVEL.SUCCESS, 'User updated successfully', { 
        id: updatedUser.id, 
        email: updatedUser.email 
      });

      return updatedUser;
    } catch (error) {
      this.logger.logError('UPDATE_USER', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    this.logger.info('DELETE_USER', LOG_LEVEL.INIT, 'Deleting user', { id });
    
    try {
      const deleted = await this.userRepo.delete(id);

      this.logger.info('DELETE_USER', LOG_LEVEL.SUCCESS, 'User deletion completed', { id, deleted });

      return deleted;
    } catch (error) {
      this.logger.logError('DELETE_USER', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }
}
