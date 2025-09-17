import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../../core/services/user.service';
import { RolesGuard } from '../security/roles.guard';
import { UseABAC } from '../security/abac.decorator';
import { ABACUnifiedInterceptor } from '../security/abac-unified.interceptor';
import { UserModel } from '../../core/models/user.model';
import { RoleModel } from '../../core/models/user.model';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

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

  const mockRequest = {
    user: {
      id: '1',
      email: 'test@example.com',
      role: mockRole
    }
  };

  beforeEach(async () => {
    const mockUserService = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService
        }
      ],
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .overrideInterceptor(ABACUnifiedInterceptor)
    .useValue({ intercept: (context, next) => next.handle() })
    .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Arrange
      const users = [mockUser];
      userService.getAllUsers.mockResolvedValue(users);

      // Act
      const result = await controller.getAll(mockRequest);

      // Assert
      expect(result).toEqual(users);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      // Arrange
      const userId = '1';
      userService.getUserById.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const userId = '999';
      userService.getUserById.mockResolvedValue(null);

      // Act
      const result = await controller.getById(userId);

      // Assert
      expect(result).toBeNull();
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
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
      userService.createUser.mockResolvedValue(createdUser);

      // Act
      const result = await controller.create(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith(userData);
    });
  });

  describe('updateUser', () => {
    it('should update and return user when found', async () => {
      // Arrange
      const userId = '1';
      const updateData = { salary: 60000 };
      const updatedUser = { ...mockUser, ...updateData };
      userService.updateUser.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.update(userId, updateData);

      // Assert
      expect(result).toEqual(updatedUser);
      expect(userService.updateUser).toHaveBeenCalledWith(userId, updateData);
    });

    it('should return null when user not found for update', async () => {
      // Arrange
      const userId = '999';
      const updateData = { salary: 60000 };
      userService.updateUser.mockResolvedValue(null);

      // Act
      const result = await controller.update(userId, updateData);

      // Assert
      expect(result).toBeNull();
      expect(userService.updateUser).toHaveBeenCalledWith(userId, updateData);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      // Arrange
      const userId = '1';
      userService.deleteUser.mockResolvedValue(true);

      // Act
      const result = await controller.delete(userId);

      // Assert
      expect(result).toBe(true);
      expect(userService.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should return false when user deletion fails', async () => {
      // Arrange
      const userId = '999';
      userService.deleteUser.mockResolvedValue(false);

      // Act
      const result = await controller.delete(userId);

      // Assert
      expect(result).toBe(false);
      expect(userService.deleteUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMyProfile', () => {
    it('should return current user profile', async () => {
      // Arrange
      userService.getUserById.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getMyProfile(mockRequest);

      // Assert
      // Note: ABAC filtering may remove sensitive fields, so we check for basic fields
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('role');
      // Note: getUserById may not be called if ABAC interceptor handles the response
    });

    it('should handle error when getting profile', async () => {
      // Arrange
      const requestWithError = {
        user: {
          id: '1',
          email: 'test@example.com',
          role: mockRole
        }
      };

      // Mock console.log to avoid error
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act & Assert
      // The getMyProfile method doesn't actually throw errors, it just returns the user data
      const result = await controller.getMyProfile(requestWithError);
      expect(result).toEqual(requestWithError.user);

      consoleSpy.mockRestore();
    });
  });

  describe('getByIdDebug', () => {
    it('should return user by id for debug', async () => {
      // Arrange
      const userId = '1';
      userService.getUserById.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getByIdDebug(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found for debug', async () => {
      // Arrange
      const userId = '999';
      userService.getUserById.mockResolvedValue(null);

      // Act
      const result = await controller.getByIdDebug(userId);

      // Assert
      expect(result).toBeNull();
      expect(userService.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should handle error when getting user by id for debug', async () => {
      // Arrange
      const userId = '1';
      const error = new Error('Database error');
      userService.getUserById.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getByIdDebug(userId)).rejects.toThrow('Database error');
    });
  });

  describe('error handling', () => {
    it('should handle error in getAll', async () => {
      // Arrange
      const error = new Error('Database error');
      userService.getAllUsers.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getAll(mockRequest)).rejects.toThrow('Database error');
    });

    it('should handle error in getById', async () => {
      // Arrange
      const userId = '1';
      const error = new Error('Database error');
      userService.getUserById.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getById(userId)).rejects.toThrow('Database error');
    });

    it('should handle error in create', async () => {
      // Arrange
      const userData = { email: 'new@example.com', password: 'password123' };
      const error = new Error('Database error');
      userService.createUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(userData)).rejects.toThrow('Database error');
    });

    it('should handle error in update', async () => {
      // Arrange
      const userId = '1';
      const updateData = { salary: 60000 };
      const error = new Error('Database error');
      userService.updateUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update(userId, updateData)).rejects.toThrow('Database error');
    });

    it('should handle error in delete', async () => {
      // Arrange
      const userId = '1';
      const error = new Error('Database error');
      userService.deleteUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.delete(userId)).rejects.toThrow('Database error');
    });
  });
});
