import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { RoleRepositoryPort } from '../ports/role.repository.port';
import { ROLE_REPOSITORY } from '../ports/role.repository.port';
import { RoleModel } from '../models/user.model';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: jest.Mocked<RoleRepositoryPort>;

  const mockRole: RoleModel = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator'
  };

  beforeEach(async () => {
    const mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: ROLE_REPOSITORY,
          useValue: mockRoleRepository
        }
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get(ROLE_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return role when found', async () => {
      // Arrange
      const roleId = '1';
      roleRepository.findById.mockResolvedValue(mockRole);

      // Act
      const result = await service.findById(roleId);

      // Assert
      expect(result).toEqual(mockRole);
      expect(roleRepository.findById).toHaveBeenCalledWith(roleId);
    });

    it('should return null when role not found', async () => {
      // Arrange
      const roleId = '999';
      roleRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(roleId);

      // Assert
      expect(result).toBeNull();
      expect(roleRepository.findById).toHaveBeenCalledWith(roleId);
    });
  });

  describe('findByName', () => {
    it('should return role when found by name', async () => {
      // Arrange
      const roleName = 'ADMIN';
      roleRepository.findByName.mockResolvedValue(mockRole);

      // Act
      const result = await service.findByName(roleName);

      // Assert
      expect(result).toEqual(mockRole);
      expect(roleRepository.findByName).toHaveBeenCalledWith(roleName);
    });

    it('should return null when role not found by name', async () => {
      // Arrange
      const roleName = 'NONEXISTENT';
      roleRepository.findByName.mockResolvedValue(null);

      // Act
      const result = await service.findByName(roleName);

      // Assert
      expect(result).toBeNull();
      expect(roleRepository.findByName).toHaveBeenCalledWith(roleName);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      // Arrange
      const roles = [mockRole];
      roleRepository.findAll.mockResolvedValue(roles);

      // Act
      const result = await service.getAllRoles();

      // Assert
      expect(result).toEqual(roles);
      expect(roleRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('createRole', () => {
    it('should create and return new role', async () => {
      // Arrange
      const roleData = {
        name: 'MANAGER',
        description: 'Manager role'
      };
      const creatorRole = 'ADMIN';
      const createdRole = { ...roleData, id: '2' } as RoleModel;
      const creatorRoleData = {
        id: '1',
        name: 'ADMIN',
        canCreateRoles: ['MANAGER', 'USER']
      };
      roleRepository.findByName.mockResolvedValue(creatorRoleData as any);
      roleRepository.save.mockResolvedValue(createdRole);

      // Act
      const result = await service.createRole(roleData, creatorRole);

      // Assert
      expect(result).toEqual(createdRole);
      // expect(roleRepository.findByName).toHaveBeenCalledWith(creatorRole);
      expect(roleRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should update and return role when found', async () => {
      // Arrange
      const roleId = '1';
      const updateData = { description: 'Updated Administrator' };
      const modifierRole = 'ADMIN';
      const updatedRole = { ...mockRole, ...updateData };
      const modifierRoleData = {
        id: '1',
        name: 'ADMIN',
        canModifyRoles: ['ADMIN', 'USER']
      };
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.findByName.mockResolvedValue(modifierRoleData as any);
      roleRepository.save.mockResolvedValue(updatedRole);

      // Act
      const result = await service.updateRole(roleId, updateData, modifierRole);

      // Assert
      expect(result).toEqual(updatedRole);
      expect(roleRepository.findById).toHaveBeenCalledWith(roleId);
      // expect(roleRepository.findByName).toHaveBeenCalledWith(modifierRole);
      expect(roleRepository.save).toHaveBeenCalled();
    });

    it('should return null when role not found for update', async () => {
      // Arrange
      const roleId = '999';
      const updateData = { description: 'Updated Administrator' };
      const modifierRole = 'ADMIN';
      roleRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.updateRole(roleId, updateData, modifierRole);

      // Assert
      expect(result).toBeNull();
      expect(roleRepository.findById).toHaveBeenCalledWith(roleId);
      expect(roleRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    it('should delete role and return true', async () => {
      // Arrange
      const roleId = '1';
      roleRepository.delete.mockResolvedValue(true);

      // Act
      const result = await service.deleteRole(roleId);

      // Assert
      expect(result).toBe(true);
      expect(roleRepository.delete).toHaveBeenCalledWith(roleId);
    });

    it('should return false when role deletion fails', async () => {
      // Arrange
      const roleId = '999';
      roleRepository.delete.mockResolvedValue(false);

      // Act
      const result = await service.deleteRole(roleId);

      // Assert
      expect(result).toBe(false);
      expect(roleRepository.delete).toHaveBeenCalledWith(roleId);
    });
  });

  describe('error handling', () => {
    it('should handle error in findById', async () => {
      // Arrange
      const roleId = '1';
      const error = new Error('Database error');
      roleRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findById(roleId)).rejects.toThrow('Database error');
    });

    it('should handle error in findByName', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const error = new Error('Database error');
      roleRepository.findByName.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findByName(roleName)).rejects.toThrow('Database error');
    });

    it('should handle error in getAllRoles', async () => {
      // Arrange
      const error = new Error('Database error');
      roleRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAllRoles()).rejects.toThrow('Database error');
    });

    it('should handle error in createRole', async () => {
      // Arrange
      const roleData = {
        name: 'MANAGER',
        description: 'Manager role'
      };
      const creatorRole = 'ADMIN';
      const creatorRoleData = {
        id: '1',
        name: 'ADMIN',
        canCreateRoles: ['MANAGER', 'USER']
      };
      const error = new Error('Database error');
      roleRepository.findByName.mockResolvedValue(creatorRoleData as any);
      roleRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createRole(roleData, creatorRole)).rejects.toThrow('Database error');
    });

    it('should handle error in updateRole when findById fails', async () => {
      // Arrange
      const roleId = '1';
      const updateData = { description: 'Updated Administrator' };
      const modifierRole = 'ADMIN';
      const error = new Error('Database error');
      roleRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateRole(roleId, updateData, modifierRole)).rejects.toThrow('Database error');
    });

    it('should handle error in updateRole when save fails', async () => {
      // Arrange
      const roleId = '1';
      const updateData = { description: 'Updated Administrator' };
      const modifierRole = 'ADMIN';
      const modifierRoleData = {
        id: '1',
        name: 'ADMIN',
        canModifyRoles: ['ADMIN', 'USER']
      };
      const error = new Error('Database error');
      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.findByName.mockResolvedValue(modifierRoleData as any);
      roleRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateRole(roleId, updateData, modifierRole)).rejects.toThrow('Database error');
    });

    it('should handle error in deleteRole', async () => {
      // Arrange
      const roleId = '1';
      const error = new Error('Database error');
      roleRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteRole(roleId)).rejects.toThrow('Database error');
    });
  });
});
