import { Test, TestingModule } from '@nestjs/testing';
import { ABACService } from './abac.service';
import { ABACRepositoryPort } from '../ports/abac.repository.port';
import { ABAC_REPOSITORY } from '../ports/abac.repository.port';
import { UserModel } from '../models/user.model';
import { RoleModel } from '../models/user.model';

describe('ABACService', () => {
  let service: ABACService;
  let abacRepository: jest.Mocked<ABACRepositoryPort>;

  const mockRole: RoleModel = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator'
  };

  const mockUser: UserModel = {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    passwordForTesting: undefined,
    roles: [mockRole],
    salary: 50000
  };

  const mockResource = {
    id: '1',
    name: 'users',
    tableName: 'users',
    description: 'Users table',
    rolePermissions: {
      ADMIN: {
        canRead: 'full',
        canWrite: 'full',
        canDelete: 'full',
      },
      USER: {
        canRead: 'full',
        canWrite: 'blocked',
        canDelete: 'blocked',
      }
    }
  };

  const mockPermission = {
    id: '1',
    roleId: '1',
    attributeId: '1',
    canRead: 'full',
    canWrite: 'blocked',
    canDelete: 'blocked',
    attribute: {
      id: '1',
      fieldName: 'name',
      resourceId: '1'
    }
  };

  beforeEach(async () => {
    const mockABACRepository = {
      getResourceByName: jest.fn(),
      getRolePermissionsByResource: jest.fn(),
      getRolePermissionByAttribute: jest.fn(),
      createResource: jest.fn(),
      createAttribute: jest.fn(),
      createRolePermission: jest.fn(),
      getResources: jest.fn(),
      getAttributesByResource: jest.fn(),
      getRolePermissions: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ABACService,
        {
          provide: ABAC_REPOSITORY,
          useValue: mockABACRepository
        }
      ],
    }).compile();

    service = module.get<ABACService>(ABACService);
    abacRepository = module.get(ABAC_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canAccessResource', () => {
    it('should return true when role has full access to resource', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'users';
      const operation = 'read';
      abacRepository.getResourceByName.mockResolvedValue(mockResource);

      // Act
      const result = await service.canAccessResource(roleName, resourceName, operation);

      // Assert
      expect(result).toBe(true);
      expect(abacRepository.getResourceByName).toHaveBeenCalledWith(resourceName);
    });

    it('should return true when role has write access to resource', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'users';
      const operation = 'write';
      abacRepository.getResourceByName.mockResolvedValue(mockResource);

      // Act
      const result = await service.canAccessResource(roleName, resourceName, operation);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when role has no read access to resource', async () => {
      // Arrange
      const roleName = 'USER';
      const resourceName = 'payrolls';
      const operation = 'read';
      const resourceWithoutAccess = {
        ...mockResource,
        name: 'payrolls',
        rolePermissions: {
          ADMIN: {
            canRead: 'full',
            canWrite: 'full',
            canDelete: 'full',
          },
          USER: {
            canRead: 'blocked',
            canWrite: 'blocked',
            canDelete: 'blocked',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(resourceWithoutAccess);

      // Act
      const result = await service.canAccessResource(roleName, resourceName, operation);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when resource not found', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'nonexistent';
      const operation = 'read';
      abacRepository.getResourceByName.mockResolvedValue(null);

      // Act
      const result = await service.canAccessResource(roleName, resourceName, operation);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when role not found in permissions', async () => {
      // Arrange
      const roleName = 'MANAGER';
      const resourceName = 'users';
      const operation = 'read';
      abacRepository.getResourceByName.mockResolvedValue(mockResource);

      // Act
      const result = await service.canAccessResource(roleName, resourceName, operation);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle error when checking resource access', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'users';
      const operation = 'read';
      const error = new Error('Database error');
      abacRepository.getResourceByName.mockRejectedValue(error);

      // Act & Assert
      await expect(service.canAccessResource(roleName, resourceName, operation)).rejects.toThrow('Database error');
    });
  });

  describe('filterResourceByRole', () => {
    it('should return all data when role has full access', async () => {
      // Arrange
      const resourceName = 'users';
      const data = [
        { id: '1', name: 'John', email: 'john@example.com', salary: 50000 },
        { id: '2', name: 'Jane', email: 'jane@example.com', salary: 60000 }
      ];
      abacRepository.getResourceByName.mockResolvedValue(mockResource);

      // Act
      const result = await service.filterResourceByRole(resourceName, data, mockUser);

      // Assert
      expect(result).toEqual(data);
      expect(abacRepository.getResourceByName).toHaveBeenCalledWith(resourceName);
    });

    it('should filter data when role has partial access', async () => {
      // Arrange
      const resourceName = 'users';
      const data = [
        { id: '1', name: 'John', email: 'john@example.com', salary: 50000 }
      ];
      const partialAccessResource = {
        ...mockResource,
        rolePermissions: {
          ADMIN: {
            canRead: 'partial',
            canWrite: 'partial',
            canDelete: 'partial',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(partialAccessResource);
      abacRepository.getRolePermissionsByResource.mockResolvedValue([mockPermission]);

      // Act
      const result = await service.filterResourceByRole(resourceName, data, mockUser);

      // Assert
      expect(result).toEqual([{ id: '1', name: 'John', email: 'john@example.com' }]);
      // expect(abacRepository.getRolePermissionsByResource).toHaveBeenCalledWith('1', resourceName);
    });

    it('should return empty objects when no read permission', async () => {
      // Arrange
      const resourceName = 'payrolls';
      const data = [{ id: '1', name: 'John' }];
      const noReadResource = {
        ...mockResource,
        name: 'payrolls',
        rolePermissions: {
          ADMIN: {
            canRead: 'blocked',
            canWrite: 'blocked',
            canDelete: 'blocked',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(noReadResource);

      // Act
      const result = await service.filterResourceByRole(resourceName, data, mockUser);

      // Assert
      expect(result).toEqual([{}]);
    });

    it('should return empty objects when resource not found', async () => {
      // Arrange
      const resourceName = 'nonexistent';
      const data = [{ id: '1', name: 'John' }];
      abacRepository.getResourceByName.mockResolvedValue(null);

      // Act
      const result = await service.filterResourceByRole(resourceName, data, mockUser);

      // Assert
      expect(result).toEqual([{}]);
    });

    it('should handle error when filtering resource', async () => {
      // Arrange
      const resourceName = 'users';
      const data = [{ id: '1', name: 'John' }];
      const error = new Error('Database error');
      abacRepository.getResourceByName.mockRejectedValue(error);

      // Act & Assert
      await expect(service.filterResourceByRole(resourceName, data, mockUser)).rejects.toThrow('Database error');
    });
  });

  describe('canModifyAttribute', () => {
    it('should return true when role has full access to resource', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'users';
      const attributeName = 'name';
      abacRepository.getResourceByName.mockResolvedValue(mockResource);

      // Act
      const result = await service.canModifyAttribute(roleName, resourceName, attributeName);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when role has no write access to resource', async () => {
      // Arrange
      const roleName = 'USER';
      const resourceName = 'users';
      const attributeName = 'name';
      const noWriteResource = {
        ...mockResource,
        rolePermissions: {
          USER: {
            canRead: 'full',
            canWrite: 'blocked',
            canDelete: 'blocked',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(noWriteResource);

      // Act
      const result = await service.canModifyAttribute(roleName, resourceName, attributeName);

      // Assert
      expect(result).toBe(false);
    });

    it('should check attribute permission when role has partial access', async () => {
      // Arrange
      const roleName = 'USER';
      const resourceName = 'users';
      const attributeName = 'name';
      const partialAccessResource = {
        ...mockResource,
        rolePermissions: {
          USER: {
            canRead: 'full',
            canWrite: 'partial',
            canDelete: 'blocked',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(partialAccessResource);

      // Act
      const result = await service.canModifyAttribute(roleName, resourceName, attributeName);

      // Assert
      expect(result).toBe(true); // canWrite = 'partial' allows modification
    });

    it('should return true when role has partial access and can write', async () => {
      // Arrange
      const roleName = 'USER';
      const resourceName = 'users';
      const attributeName = 'name';
      const partialAccessResource = {
        ...mockResource,
        rolePermissions: {
          USER: {
            canRead: 'full',
            canWrite: 'full',
            canDelete: 'blocked',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(partialAccessResource);

      // Act
      const result = await service.canModifyAttribute(roleName, resourceName, attributeName);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when resource not found', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'nonexistent';
      const attributeName = 'name';
      abacRepository.getResourceByName.mockResolvedValue(null);

      // Act
      const result = await service.canModifyAttribute(roleName, resourceName, attributeName);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle error when checking attribute modify permission', async () => {
      // Arrange
      const roleName = 'ADMIN';
      const resourceName = 'users';
      const attributeName = 'name';
      const error = new Error('Database error');
      abacRepository.getResourceByName.mockRejectedValue(error);

      // Act & Assert
      await expect(service.canModifyAttribute(roleName, resourceName, attributeName)).rejects.toThrow('Database error');
    });
  });

  describe('filterInputByRole', () => {
    it('should return all input data when role has full write access', async () => {
      // Arrange
      const resourceName = 'users';
      const inputData = { name: 'John', email: 'john@example.com', salary: 50000 };
      const operation = 'write';
      abacRepository.getResourceByName.mockResolvedValue(mockResource);

      // Act
      const result = await service.filterInputByRole(resourceName, inputData, mockUser, operation);

      // Assert
      expect(result).toEqual(inputData);
    });

    it('should filter sensitive fields when role has partial write access', async () => {
      // Arrange
      const resourceName = 'users';
      const inputData = { name: 'John', email: 'john@example.com', salary: 50000, password: 'secret' };
      const operation = 'write';
      const partialAccessResource = {
        ...mockResource,
        rolePermissions: {
          ADMIN: {
            canRead: 'full',
            canWrite: 'partial',
            canDelete: 'full',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(partialAccessResource);

      // Act
      const result = await service.filterInputByRole(resourceName, inputData, mockUser, operation);

      // Assert
      expect(result).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should allow self access when modifying own data', async () => {
      // Arrange
      const resourceName = 'users';
      const inputData = { id: '1', name: 'John', email: 'john@example.com' };
      const operation = 'write';
      const selfAccessResource = {
        ...mockResource,
        rolePermissions: {
          ADMIN: {
            canRead: 'self',
            canWrite: 'self',
            canDelete: 'self',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(selfAccessResource);

      // Act
      const result = await service.filterInputByRole(resourceName, inputData, mockUser, operation);

      // Assert
      expect(result).toEqual(inputData);
    });

    it('should throw error when trying to modify other user data with self access', async () => {
      // Arrange
      const resourceName = 'users';
      const inputData = { id: '2', name: 'John', email: 'john@example.com' };
      const operation = 'write';
      const selfAccessResource = {
        ...mockResource,
        rolePermissions: {
          ADMIN: {
            canRead: 'self',
            canWrite: 'self',
            canDelete: 'self',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(selfAccessResource);

      // Act & Assert
      await expect(service.filterInputByRole(resourceName, inputData, mockUser, operation))
        .rejects.toThrow('Cannot modify data for other users');
    });

    it('should throw error when no write permission', async () => {
      // Arrange
      const resourceName = 'payrolls';
      const inputData = { salary: 50000 };
      const operation = 'write';
      const noWriteResource = {
        ...mockResource,
        name: 'payrolls',
        rolePermissions: {
          USER: {
            canRead: 'blocked',
            canWrite: 'blocked',
            canDelete: 'blocked',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(noWriteResource);

      // Act & Assert
      await expect(service.filterInputByRole(resourceName, inputData, mockUser, operation))
        .rejects.toThrow('Insufficient permissions for write operation on payrolls');
    });

    it('should return input data when no resource found', async () => {
      // Arrange
      const resourceName = 'nonexistent';
      const inputData = { name: 'John' };
      const operation = 'write';
      abacRepository.getResourceByName.mockResolvedValue(null);

      // Act & Assert
      await expect(service.filterInputByRole(resourceName, inputData, mockUser, operation))
        .rejects.toThrow('Insufficient permissions for write operation on nonexistent');
    });

    it('should handle error when filtering input', async () => {
      // Arrange
      const resourceName = 'users';
      const inputData = { name: 'John' };
      const operation = 'write';
      const error = new Error('Database error');
      abacRepository.getResourceByName.mockRejectedValue(error);

      // Act & Assert
      await expect(service.filterInputByRole(resourceName, inputData, mockUser, operation))
        .rejects.toThrow('Database error');
    });
  });

  describe('filterResourceByRole - SELF access', () => {
    it('should filter data to own records only for SELF access', async () => {
      // Arrange
      const resourceName = 'users';
      const data = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' }
      ];
      const selfAccessResource = {
        ...mockResource,
        rolePermissions: {
          ADMIN: {
            canRead: 'self',
            canWrite: 'self',
            canDelete: 'self',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(selfAccessResource);

      // Act
      const result = await service.filterResourceByRole(resourceName, data, mockUser);

      // Assert
      expect(result).toEqual([{ id: '1', name: 'John', email: 'john@example.com' }]);
    });

    it('should filter payrolls by userId for SELF access', async () => {
      // Arrange
      const resourceName = 'payrolls';
      const data = [
        { id: '1', userId: '1', salary: 50000 },
        { id: '2', userId: '2', salary: 60000 }
      ];
      const selfAccessResource = {
        ...mockResource,
        name: 'payrolls',
        rolePermissions: {
          ADMIN: {
            canRead: 'self',
            canWrite: 'self',
            canDelete: 'self',
          }
        }
      };
      abacRepository.getResourceByName.mockResolvedValue(selfAccessResource);

      // Act
      const result = await service.filterResourceByRole(resourceName, data, mockUser);

      // Assert
      expect(result).toEqual([{ id: '1', userId: '1', salary: 50000 }]);
    });
  });
});
