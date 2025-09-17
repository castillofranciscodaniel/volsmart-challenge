import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleRepositoryImpl } from './role.repository.impl';
import { RoleEntity } from '../infraestructure/postgress/entities/role.entity';
import { RoleModel, RoleType } from '../core/models/user.model';

describe('RoleRepositoryImpl', () => {
  let repository: RoleRepositoryImpl;
  let roleEntityRepository: jest.Mocked<Repository<RoleEntity>>;

  const mockRoleModel: RoleModel = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator',
    type: RoleType.ADMIN
  };

  const mockRoleEntity: RoleEntity = {
    id: '1',
    name: 'ADMIN',
    description: 'Administrator',
    type: RoleType.ADMIN
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
        RoleRepositoryImpl,
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRepository
        }
      ],
    }).compile();

    repository = module.get<RoleRepositoryImpl>(RoleRepositoryImpl);
    roleEntityRepository = module.get(getRepositoryToken(RoleEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return role model when entity found', async () => {
      // Arrange
      const roleId = '1';
      roleEntityRepository.findOne.mockResolvedValue(mockRoleEntity);

      // Act
      const result = await repository.findById(roleId);

      // Assert
      expect(result).toEqual(mockRoleModel);
      expect(roleEntityRepository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
    });

    it('should return null when entity not found', async () => {
      // Arrange
      const roleId = '999';
      roleEntityRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(roleId);

      // Assert
      expect(result).toBeNull();
      expect(roleEntityRepository.findOne).toHaveBeenCalledWith({ where: { id: roleId } });
    });
  });

  describe('findByName', () => {
    it('should return role model when entity found by name', async () => {
      // Arrange
      const roleName = 'ADMIN';
      roleEntityRepository.findOne.mockResolvedValue(mockRoleEntity);

      // Act
      const result = await repository.findByName(roleName);

      // Assert
      expect(result).toEqual(mockRoleModel);
      expect(roleEntityRepository.findOne).toHaveBeenCalledWith({ where: { name: roleName } });
    });

    it('should return null when entity not found by name', async () => {
      // Arrange
      const roleName = 'NONEXISTENT';
      roleEntityRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByName(roleName);

      // Assert
      expect(result).toBeNull();
      expect(roleEntityRepository.findOne).toHaveBeenCalledWith({ where: { name: roleName } });
    });
  });

  describe('findAll', () => {
    it('should return array of role models', async () => {
      // Arrange
      const entities = [mockRoleEntity];
      roleEntityRepository.find.mockResolvedValue(entities);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([mockRoleModel]);
      expect(roleEntityRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no entities found', async () => {
      // Arrange
      roleEntityRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(roleEntityRepository.find).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save and return role model', async () => {
      // Arrange
      const savedEntity = { ...mockRoleEntity, id: '2' };
      roleEntityRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await repository.save(mockRoleModel);

      // Assert
      expect(result).toEqual({ ...mockRoleModel, id: '2' });
      expect(roleEntityRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete role and return true', async () => {
      // Arrange
      const roleId = '1';
      roleEntityRepository.delete.mockResolvedValue({ affected: 1 } as any);

      // Act
      const result = await repository.delete(roleId);

      // Assert
      expect(result).toBe(true);
      expect(roleEntityRepository.delete).toHaveBeenCalledWith(roleId);
    });

    it('should return false when no role deleted', async () => {
      // Arrange
      const roleId = '999';
      roleEntityRepository.delete.mockResolvedValue({ affected: 0 } as any);

      // Act
      const result = await repository.delete(roleId);

      // Assert
      expect(result).toBe(false);
      expect(roleEntityRepository.delete).toHaveBeenCalledWith(roleId);
    });
  });
});
