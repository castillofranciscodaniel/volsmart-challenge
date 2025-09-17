import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepositoryImpl } from './user.repository.impl';
import { UserEntity } from '../infraestructure/postgress/entities/user.entity';
import { UserModel } from '../core/models/user.model';
import { RoleModel } from '../core/models/user.model';

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  let userEntityRepository: jest.Mocked<Repository<UserEntity>>;

  const mockRole: RoleModel = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator'
  };

  const mockUserModel: UserModel = {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    passwordForTesting: undefined,
    roles: [mockRole],
    salary: 50000
  };

  const mockUserEntity: UserEntity = {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    passwordForTesting: undefined,
    roles: [{
      id: '1',
      name: 'ADMIN',
      description: 'Administrator'
    } as any],
    salary: 50000
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepositoryImpl,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository
        }
      ],
    }).compile();

    repository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
    userEntityRepository = module.get(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return user model when entity found', async () => {
      // Arrange
      const userId = '1';
      userEntityRepository.findOne.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toEqual(mockUserModel);
      expect(userEntityRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: userId },
        relations: ['roles']
      });
    });

    it('should return null when entity not found', async () => {
      // Arrange
      const userId = '999';
      userEntityRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toBeNull();
      expect(userEntityRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: userId },
        relations: ['roles']
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user model when entity found by email', async () => {
      // Arrange
      const email = 'test@example.com';
      userEntityRepository.findOne.mockResolvedValue(mockUserEntity);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toEqual(mockUserModel);
      expect(userEntityRepository.findOne).toHaveBeenCalledWith({ 
        where: { email },
        relations: ['roles']
      });
    });

    it('should return null when entity not found by email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      userEntityRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toBeNull();
      expect(userEntityRepository.findOne).toHaveBeenCalledWith({ 
        where: { email },
        relations: ['roles']
      });
    });
  });

  describe('findAll', () => {
    it('should return array of user models', async () => {
      // Arrange
      const entities = [mockUserEntity];
      userEntityRepository.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([mockUserModel]);
      expect(userEntityRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no entities found', async () => {
      // Arrange
      userEntityRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(userEntityRepository.find).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save and return user model', async () => {
      // Arrange
      const savedEntity = { ...mockUserEntity, id: '2' };
      userEntityRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await repository.save(mockUserModel);

      // Assert
      expect(result).toEqual({ ...mockUserModel, id: '2' });
      expect(userEntityRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete user and return true', async () => {
      // Arrange
      const userId = '1';
      userEntityRepository.delete.mockResolvedValue({ affected: 1 } as any);

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(true);
      expect(userEntityRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should return false when no user deleted', async () => {
      // Arrange
      const userId = '999';
      userEntityRepository.delete.mockResolvedValue({ affected: 0 } as any);

      // Act
      const result = await repository.delete(userId);

      // Assert
      expect(result).toBe(false);
      expect(userEntityRepository.delete).toHaveBeenCalledWith(userId);
    });
  });
});
