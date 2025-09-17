import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from '../../core/services/role.service';
import { RolesGuard } from '../security/roles.guard';
import { RoleModel, RoleType } from '../../core/models/user.model';

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: jest.Mocked<RoleService>;

  const mockRole: RoleModel = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator',
    type: RoleType.ADMIN
  };

  beforeEach(async () => {
    const mockRoleService = {
      getAllRoles: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService
        }
      ],
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get(RoleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      // Arrange
      const roles = [mockRole];
      roleService.getAllRoles.mockResolvedValue(roles);

      // Act
      const result = await controller.getAll();

      // Assert
      expect(result).toEqual(roles);
      expect(roleService.getAllRoles).toHaveBeenCalled();
    });
  });

  describe('getRoleById', () => {
    it('should return role by id', async () => {
      // Arrange
      const roleId = '1';
      roleService.findById.mockResolvedValue(mockRole);

      // Act
      const result = await controller.getById(roleId);

      // Assert
      expect(result).toEqual(mockRole);
      expect(roleService.findById).toHaveBeenCalledWith(roleId);
    });

    it('should return null when role not found', async () => {
      // Arrange
      const roleId = '999';
      roleService.findById.mockResolvedValue(null);

      // Act
      const result = await controller.getById(roleId);

      // Assert
      expect(result).toBeNull();
      expect(roleService.findById).toHaveBeenCalledWith(roleId);
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name', async () => {
      // Arrange
      const roleName = 'ADMIN';
      roleService.findByName.mockResolvedValue(mockRole);

      // Act
      const result = await controller.getByName(roleName);

      // Assert
      expect(result).toEqual(mockRole);
      expect(roleService.findByName).toHaveBeenCalledWith(roleName);
    });

    it('should return null when role not found by name', async () => {
      // Arrange
      const roleName = 'NONEXISTENT';
      roleService.findByName.mockResolvedValue(null);

      // Act
      const result = await controller.getByName(roleName);

      // Assert
      expect(result).toBeNull();
      expect(roleService.findByName).toHaveBeenCalledWith(roleName);
    });
  });

  describe('createRole', () => {
    it('should create and return new role', async () => {
      // Arrange
      const roleData = {
        name: 'MANAGER',
        description: 'Manager role'
      };
      const createdRole = { ...roleData, id: '2' } as RoleModel;
      const mockUser = {
        id: '1',
        roles: [{ name: 'ADMIN' }]
      };
      roleService.createRole.mockResolvedValue(createdRole);

      // Act
      const result = await controller.create(roleData, mockUser);

      // Assert
      expect(result).toEqual(createdRole);
      expect(roleService.createRole).toHaveBeenCalledWith(roleData);
    });
  });

  describe('updateRole', () => {
    it('should update and return role when found', async () => {
      // Arrange
      const roleId = '1';
      const updateData = { description: 'Updated Administrator' };
      const updatedRole = { ...mockRole, ...updateData };
      const mockUser = {
        id: '1',
        roles: [{ name: 'ADMIN' }]
      };
      roleService.updateRole.mockResolvedValue(updatedRole);

      // Act
      const result = await controller.update(roleId, updateData, mockUser);

      // Assert
      expect(result).toEqual(updatedRole);
      expect(roleService.updateRole).toHaveBeenCalledWith(roleId, updateData);
    });

    it('should return null when role not found for update', async () => {
      // Arrange
      const roleId = '999';
      const updateData = { description: 'Updated Administrator' };
      const mockUser = {
        id: '1',
        roles: [{ name: 'ADMIN' }]
      };
      roleService.updateRole.mockResolvedValue(null);

      // Act
      const result = await controller.update(roleId, updateData, mockUser);

      // Assert
      expect(result).toBeNull();
      expect(roleService.updateRole).toHaveBeenCalledWith(roleId, updateData);
    });
  });

  describe('deleteRole', () => {
    it('should delete role and return true', async () => {
      // Arrange
      const roleId = '1';
      roleService.deleteRole.mockResolvedValue(true);

      // Act
      const result = await controller.delete(roleId);

      // Assert
      expect(result).toBe(true);
      expect(roleService.deleteRole).toHaveBeenCalledWith(roleId);
    });

    it('should return false when role deletion fails', async () => {
      // Arrange
      const roleId = '999';
      roleService.deleteRole.mockResolvedValue(false);

      // Act
      const result = await controller.delete(roleId);

      // Assert
      expect(result).toBe(false);
      expect(roleService.deleteRole).toHaveBeenCalledWith(roleId);
    });
  });

  describe('error handling', () => {
    it('should handle error in getAll', async () => {
      // Arrange
      const error = new Error('Database error');
      roleService.getAllRoles.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getAll()).rejects.toThrow('Database error');
    });

    it('should handle error in getById', async () => {
      // Arrange
      const roleId = '1';
      const error = new Error('Database error');
      roleService.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getById(roleId)).rejects.toThrow('Database error');
    });

    it('should handle error in getByName', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const error = new Error('Database error');
      roleService.findByName.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getByName(roleName)).rejects.toThrow('Database error');
    });

    it('should handle error in create', async () => {
      // Arrange
      const roleData = { name: 'MANAGER', description: 'Manager role' };
      const mockUser = { id: '1', roles: [{ name: 'ADMIN' }] };
      const error = new Error('Database error');
      roleService.createRole.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(roleData, mockUser)).rejects.toThrow('Database error');
    });

    it('should handle error in update', async () => {
      // Arrange
      const roleId = '1';
      const updateData = { description: 'Updated Administrator' };
      const mockUser = { id: '1', roles: [{ name: 'ADMIN' }] };
      const error = new Error('Database error');
      roleService.updateRole.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update(roleId, updateData, mockUser)).rejects.toThrow('Database error');
    });

    it('should handle error in delete', async () => {
      // Arrange
      const roleId = '1';
      const error = new Error('Database error');
      roleService.deleteRole.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(roleId)).rejects.toThrow('Database error');
    });
  });
});
