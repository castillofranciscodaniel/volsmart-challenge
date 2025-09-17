import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoleService } from '../../core/services/role.service';
import { RolesGuard } from '../security/roles.guard';
import { Roles } from '../security/roles.guard';
import { RoleModel, RoleType } from '../../core/models/user.model';
import { LoggerCustomService, LOG_LEVEL } from '../../core/services/logger-custom.service';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('roles')
@UseGuards(RolesGuard)
export class RoleController {
  private readonly logger: LoggerCustomService = new LoggerCustomService(RoleController.name);

  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async getAll(): Promise<RoleModel[]> {
    this.logger.info('GET_ALL', LOG_LEVEL.INIT, 'Get all roles request received');
    
    try {
      const roles = await this.roleService.getAllRoles();

      this.logger.info('GET_ALL', LOG_LEVEL.SUCCESS, 'All roles retrieved successfully', { count: roles.length });

      return roles;
    } catch (error) {
      this.logger.logError('GET_ALL', LOG_LEVEL.ERROR, error as Error);
      throw error;
    }
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async getById(@Param('id') id: string): Promise<RoleModel | null> {
    this.logger.info('GET_BY_ID', LOG_LEVEL.INIT, 'Get role by ID request received', { id });
    
    try {
      const role = await this.roleService.findById(id);

      this.logger.info('GET_BY_ID', LOG_LEVEL.SUCCESS, 'Role retrieved by ID successfully', { id, found: !!role });

      return role;
    } catch (error) {
      this.logger.logError('GET_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  @Get('name/:name')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async getByName(@Param('name') name: string): Promise<RoleModel | null> {
    this.logger.info('GET_ROLE_BY_NAME', LOG_LEVEL.INIT, 'Get role by name request received', { name });
    
    try {
      const role = await this.roleService.findByName(name);

      this.logger.info('GET_BY_NAME', LOG_LEVEL.SUCCESS, 'Role retrieved by name successfully', { name, found: !!role });

      return role;
    } catch (error) {
      this.logger.logError('GET_BY_NAME', LOG_LEVEL.ERROR, error as Error, { name });
      throw error;
    }
  }

  @Post()
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async create(@Body() roleData: Partial<RoleModel>, @CurrentUser() user: any): Promise<RoleModel> {
    this.logger.info('CREATE', LOG_LEVEL.INIT, 'Create role request received', { name: roleData.name });
    
    try {
      const role = await this.roleService.createRole(roleData as RoleModel);

      this.logger.info('CREATE', LOG_LEVEL.SUCCESS, 'Role created successfully', { id: role.id, name: role.name });

      return role;
    } catch (error) {
      this.logger.logError('CREATE', LOG_LEVEL.ERROR, error as Error, { name: roleData.name });
      throw error;
    }
  }

  @Put(':id')
  @Roles(RoleType.ADMIN, RoleType.MANAGER)
  async update(@Param('id') id: string, @Body() roleData: Partial<RoleModel>, @CurrentUser() user: any): Promise<RoleModel | null> {
    this.logger.info('UPDATE', LOG_LEVEL.INIT, 'Update role request received', { id, updateData: roleData });
    
    try {
      const role = await this.roleService.updateRole(id, roleData);

      this.logger.info('UPDATE', LOG_LEVEL.SUCCESS, 'Role updated successfully', { id, found: !!role });

      return role;
    } catch (error) {
      this.logger.logError('UPDATE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  async delete(@Param('id') id: string): Promise<boolean> {
    this.logger.info('DELETE', LOG_LEVEL.INIT, 'Delete role request received', { id });
    
    try {
      const deleted = await this.roleService.deleteRole(id);

      this.logger.info('DELETE', LOG_LEVEL.SUCCESS, 'Role deletion completed', { id, deleted });

      return deleted;
    } catch (error) {
      this.logger.logError('DELETE', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }
}
