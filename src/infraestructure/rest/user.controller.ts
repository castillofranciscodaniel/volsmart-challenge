import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from '../../core/services/user.service';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.guard';
import { UseABAC } from '../security/abac.decorator';
import { UserModel, RoleType } from '../../core/models/user.model';
import { LoggerCustomService, LOG_LEVEL } from '../../core/services/logger-custom.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  private readonly logger: LoggerCustomService = new LoggerCustomService(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  @UseABAC()
  async getAll(@Request() req): Promise<UserModel[]> {
    this.logger.info('GET_ALL', LOG_LEVEL.INIT, 'Get all users request received', {
      requestingUserId: req.user?.id 
    });
    
    try {
      const users = await this.userService.getAllUsers();

      this.logger.info('GET_ALL', LOG_LEVEL.SUCCESS, 'All users retrieved successfully', {
        count: users.length 
      });

      return users;
    } catch (error) {
      this.logger.logError('GET_ALL', LOG_LEVEL.ERROR, error as Error);
      throw error;
    }
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  @UseABAC()
  async getById(@Param('id') id: string): Promise<UserModel | null> {
    this.logger.info('GET_BY_ID', LOG_LEVEL.INIT, 'Get user by ID request received', { id });
    
    try {
      const user = await this.userService.getUserById(id);

      this.logger.info('GET_BY_ID', LOG_LEVEL.SUCCESS, 'User retrieved by ID successfully', {
        id, 
        found: !!user,
        userData: user ? { id: user.id, email: user.email, roles: user.roles?.map(r => r.name) } : null
      });

      return user;
    } catch (error) {
      this.logger.logError('GET_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  @Get('debug/:id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async getByIdDebug(@Param('id') id: string): Promise<UserModel | null> {
    this.logger.info('GET_BY_ID_DEBUG', LOG_LEVEL.INIT, 'Get user by ID debug request received', { id });
    
    try {
      const user = await this.userService.getUserById(id);

      this.logger.info('GET_BY_ID_DEBUG', LOG_LEVEL.SUCCESS, 'User retrieved by ID debug successfully', {
        id, 
        found: !!user,
        userData: user ? { id: user.id, email: user.email, roles: user.roles?.map(r => r.name) } : null
      });

      return user;
    } catch (error) {
      this.logger.logError('GET_BY_ID_DEBUG', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  @Post()
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  @UseABAC()
  async create(@Body() userData: Partial<UserModel>): Promise<UserModel> {
    this.logger.info('CREATE', LOG_LEVEL.INIT, 'Create user request received', {
      email: userData.email 
    });
    
    try {
      const user = await this.userService.createUser(userData);

      this.logger.info('CREATE', LOG_LEVEL.SUCCESS, 'User created successfully', {
        id: user.id, 
        email: user.email 
      });

      return user;
    } catch (error) {
      this.logger.logError('CREATE', LOG_LEVEL.ERROR, error as Error, { email: userData.email });
      throw error;
    }
  }

  @Put(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  @UseABAC()
  async update(@Param('id') id: string, @Body() userData: Partial<UserModel>): Promise<UserModel | null> {
    this.logger.info('UPDATE', LOG_LEVEL.INIT, 'Update user request received', {
      id, 
      updateData: userData 
    });
    
    try {
      const user = await this.userService.updateUser(id, userData);

      this.logger.info('UPDATE', LOG_LEVEL.SUCCESS, 'User updated successfully', {
        id, 
        found: !!user 
      });

      return user;
    } catch (error) {
      this.logger.logError('UPDATE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  @UseABAC()
  async delete(@Param('id') id: string): Promise<boolean> {
    this.logger.info('DELETE', LOG_LEVEL.INIT, 'Delete user request received', { id });
    
    try {
      const deleted = await this.userService.deleteUser(id);

      this.logger.info('DELETE', LOG_LEVEL.SUCCESS, 'User deletion completed', {
        id, 
        deleted 
      });

      return deleted;
    } catch (error) {
      this.logger.logError('DELETE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  @Get('profile/me')
  @UseGuards(RolesGuard)
  async getMyProfile(@Request() req): Promise<UserModel | null> {
    this.logger.info('GET_MY_PROFILE', LOG_LEVEL.INIT, 'Get my profile request received', { 
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRoles: req.user?.roles
    });
    
    try {
      // req.user ya contiene el usuario completo gracias al RolesGuard
      const userData = req.user;

      this.logger.info('GET_MY_PROFILE', LOG_LEVEL.SUCCESS, 'Profile retrieved successfully', { 
        requestedUserId: req.user.id,
        returnedUserId: userData?.id,
        returnedEmail: userData?.email,
        found: !!userData 
      });

      return userData;
    } catch (error) {
      this.logger.logError('GET_MY_PROFILE', LOG_LEVEL.ERROR, error as Error, { userId: req.user?.id });
      throw error;
    }
  }
}
