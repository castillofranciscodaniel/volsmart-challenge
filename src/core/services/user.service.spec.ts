import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import { UserModel } from '../models/user.model';
import { RoleModel } from '../models/user.model';
import { ABACService } from './abac.service';
import { EncryptionService } from './encryption.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let abacService: jest.Mocked<ABACService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  const mockRole: RoleModel = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator'
  };

  const mockUser: UserModel = {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    role: mockRole,
    salary: 50000
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    const mockABACService = {
      filterResourceByRole: jest.fn(),
      filterSingleResourceByRole: jest.fn(),
      canAccessAttribute: jest.fn(),
      canModifyAttribute: jest.fn(),
      createResource: jest.fn(),
      createAttribute: jest.fn(),
      createRolePermission: jest.fn(),
      getResources: jest.fn(),
      getAttributesByResource: jest.fn(),
      getRolePermissions: jest.fn()
    };

    const mockEncryptionService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository
        },
        {
          provide: ABACService,
          useValue: mockABACService
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(USER_REPOSITORY);
    abacService = module.get(ABACService);
    encryptionService = module.get(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '1';
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = '999';
      userRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(result).toBeNull();
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      // Arrange
      const email = 'test@example.com';
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      userRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(result).toBeNull();
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [mockUser];
      userRepository.findAll.mockResolvedValue(users);

      // Act
      const result = await service.getAllUsers();

      // Assert
      expect(result).toEqual(users);
      expect(userRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      // Arrange
      const userId = '1';
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('createUser', () => {
    it('should create and return new user', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        role: mockRole,
        salary: 40000
      };
      const createdUser = { ...userData, id: '2' } as UserModel;
      userRepository.save.mockResolvedValue(createdUser);

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update and return user when found', async () => {
      // Arrange
      const userId = '1';
      const updateData = { salary: 60000 };
      const updatedUser = { ...mockUser, ...updateData };
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUser(userId, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should return null when user not found for update', async () => {
      // Arrange
      const userId = '999';
      const updateData = { salary: 60000 };
      userRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.updateUser(userId, updateData);

      // Assert
      expect(result).toBeNull();
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      // Arrange
      const userId = '1';
      userRepository.delete.mockResolvedValue(true);

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      expect(result).toBe(true);
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should return false when user deletion fails', async () => {
      // Arrange
      const userId = '999';
      userRepository.delete.mockResolvedValue(false);

      // Act
      const result = await service.deleteUser(userId);

      // Assert
      expect(result).toBe(false);
      expect(userRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe('error handling', () => {
    it('should handle error in findById', async () => {
      // Arrange
      const userId = '1';
      const error = new Error('Database error');
      userRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findById(userId)).rejects.toThrow('Database error');
    });

    it('should handle error in findByEmail', async () => {
      // Arrange
      const email = 'test@example.com';
      const error = new Error('Database error');
      userRepository.findByEmail.mockRejectedValue(error);

      // Act & Assert
      await expect(service.findByEmail(email)).rejects.toThrow('Database error');
    });

    it('should handle error in getAllUsers', async () => {
      // Arrange
      const error = new Error('Database error');
      userRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAllUsers()).rejects.toThrow('Database error');
    });

    it('should handle error in getUserById', async () => {
      // Arrange
      const userId = '1';
      const error = new Error('Database error');
      userRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getUserById(userId)).rejects.toThrow('Database error');
    });

    it('should handle error in createUser', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        role: mockRole,
        salary: 40000
      };
      const error = new Error('Database error');
      userRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow('Database error');
    });

    it('should handle error in updateUser when findById fails', async () => {
      // Arrange
      const userId = '1';
      const updateData = { salary: 60000 };
      const error = new Error('Database error');
      userRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateUser(userId, updateData)).rejects.toThrow('Database error');
    });

    it('should handle error in updateUser when save fails', async () => {
      // Arrange
      const userId = '1';
      const updateData = { salary: 60000 };
      const error = new Error('Database error');
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateUser(userId, updateData)).rejects.toThrow('Database error');
    });

    it('should handle error in deleteUser', async () => {
      // Arrange
      const userId = '1';
      const error = new Error('Database error');
      userRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteUser(userId)).rejects.toThrow('Database error');
    });
  });
});
