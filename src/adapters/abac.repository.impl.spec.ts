import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ABACRepositoryImpl } from './abac.repository.impl';
import { ResourceEntity } from '../infraestructure/postgress/entities/resource.entity';
import { AttributeEntity } from '../infraestructure/postgress/entities/attribute.entity';
import { ResourceModel, AttributeModel } from '../core/models/abac.model';
import { PermissionType } from '../core/constants/permission.types';

describe('ABACRepositoryImpl', () => {
  let service: ABACRepositoryImpl;
  let resourceRepository: Repository<ResourceEntity>;
  let attributeRepository: Repository<AttributeEntity>;

  const mockResourceRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAttributeRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ABACRepositoryImpl,
        {
          provide: getRepositoryToken(ResourceEntity),
          useValue: mockResourceRepository,
        },
        {
          provide: getRepositoryToken(AttributeEntity),
          useValue: mockAttributeRepository,
        },
      ],
    }).compile();

    service = module.get<ABACRepositoryImpl>(ABACRepositoryImpl);
    resourceRepository = module.get<Repository<ResourceEntity>>(
      getRepositoryToken(ResourceEntity),
    );
    attributeRepository = module.get<Repository<AttributeEntity>>(
      getRepositoryToken(AttributeEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createResource', () => {
    it('should create a resource successfully', async () => {
      const resourceModel: ResourceModel = {
        id: '1',
        name: 'users',
        tableName: 'users',
        description: 'Users resource',
        rolePermissions: {
          MANAGER: {
            canRead: PermissionType.FULL,
            canWrite: PermissionType.FULL,
            canDelete: PermissionType.FULL,
          },
        },
      };

      const resourceEntity = new ResourceEntity();
      resourceEntity.id = '1';
      resourceEntity.name = 'users';
      resourceEntity.tableName = 'users';
      resourceEntity.description = 'Users resource';
      resourceEntity.rolePermissions = resourceModel.rolePermissions;

      mockResourceRepository.save.mockResolvedValue(resourceEntity);

      const result = await service.createResource(resourceModel);

      expect(mockResourceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'users',
          tableName: 'users',
          description: 'Users resource',
          rolePermissions: resourceModel.rolePermissions,
        }),
      );
      expect(result).toEqual(resourceModel);
    });
  });

  describe('getResources', () => {
    it('should return all resources', async () => {
      const resourceEntities = [
        {
          id: '1',
          name: 'users',
          tableName: 'users',
          description: 'Users resource',
          rolePermissions: {
            MANAGER: {
              canRead: PermissionType.FULL,
              canWrite: PermissionType.FULL,
              canDelete: PermissionType.FULL,
            },
          },
        },
        {
          id: '2',
          name: 'payrolls',
          tableName: 'payrolls',
          description: 'Payrolls resource',
          rolePermissions: {
            MANAGER: {
              canRead: PermissionType.FULL,
              canWrite: PermissionType.FULL,
              canDelete: PermissionType.FULL,
            },
          },
        },
      ];

      mockResourceRepository.find.mockResolvedValue(resourceEntities);

      const result = await service.getResources();

      expect(mockResourceRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'users',
        tableName: 'users',
        description: 'Users resource',
        rolePermissions: {
          MANAGER: {
            canRead: PermissionType.FULL,
            canWrite: PermissionType.FULL,
            canDelete: PermissionType.FULL,
          },
        },
      });
    });
  });

  describe('getResourceByName', () => {
    it('should return a resource by name', async () => {
      const resourceEntity = {
        id: '1',
        name: 'users',
        tableName: 'users',
        description: 'Users resource',
        rolePermissions: {
          MANAGER: {
            canRead: PermissionType.FULL,
            canWrite: PermissionType.FULL,
            canDelete: PermissionType.FULL,
          },
        },
      };

      mockResourceRepository.findOne.mockResolvedValue(resourceEntity);

      const result = await service.getResourceByName('users');

      expect(mockResourceRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'users' },
      });
      expect(result).toEqual({
        id: '1',
        name: 'users',
        tableName: 'users',
        description: 'Users resource',
        rolePermissions: {
          MANAGER: {
            canRead: PermissionType.FULL,
            canWrite: PermissionType.FULL,
            canDelete: PermissionType.FULL,
          },
        },
      });
    });

    it('should return null when resource not found', async () => {
      mockResourceRepository.findOne.mockResolvedValue(null);

      const result = await service.getResourceByName('nonexistent');

      expect(mockResourceRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });

  describe('createAttribute', () => {
    it('should create an attribute successfully', async () => {
      const attributeModel: AttributeModel = {
        id: '1',
        name: 'salary',
        fieldName: 'salary',
        description: 'User salary',
        isSensitive: true,
        resourceId: '1',
      };

      const attributeEntity = new AttributeEntity();
      attributeEntity.id = '1';
      attributeEntity.name = 'salary';
      attributeEntity.fieldName = 'salary';
      attributeEntity.description = 'User salary';
      attributeEntity.isSensitive = true;
      attributeEntity.resourceId = '1';

      mockAttributeRepository.save.mockResolvedValue(attributeEntity);

      const result = await service.createAttribute(attributeModel);

      expect(mockAttributeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'salary',
          fieldName: 'salary',
          description: 'User salary',
          isSensitive: true,
          resourceId: '1',
        }),
      );
      expect(result).toEqual(attributeModel);
    });
  });

  describe('getAttributesByResource', () => {
    it('should return attributes by resource ID', async () => {
      const attributeEntities = [
        {
          id: '1',
          name: 'salary',
          fieldName: 'salary',
          description: 'User salary',
          isSensitive: true,
          resourceId: '1',
        },
        {
          id: '2',
          name: 'email',
          fieldName: 'email',
          description: 'User email',
          isSensitive: false,
          resourceId: '1',
        },
      ];

      mockAttributeRepository.find.mockResolvedValue(attributeEntities);

      const result = await service.getAttributesByResource('1');

      expect(mockAttributeRepository.find).toHaveBeenCalledWith({
        where: { resourceId: '1' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        name: 'salary',
        fieldName: 'salary',
        description: 'User salary',
        isSensitive: true,
        resourceId: '1',
      });
    });
  });

  describe('getAttributeByResourceAndField', () => {
    it('should return an attribute by resource ID and field name', async () => {
      const attributeEntity = {
        id: '1',
        name: 'salary',
        fieldName: 'salary',
        description: 'User salary',
        isSensitive: true,
        resourceId: '1',
      };

      mockAttributeRepository.findOne.mockResolvedValue(attributeEntity);

      const result = await service.getAttributeByResourceAndField('1', 'salary');

      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({
        where: { resourceId: '1', fieldName: 'salary' },
      });
      expect(result).toEqual({
        id: '1',
        name: 'salary',
        fieldName: 'salary',
        description: 'User salary',
        isSensitive: true,
        resourceId: '1',
      });
    });

    it('should return null when attribute not found', async () => {
      mockAttributeRepository.findOne.mockResolvedValue(null);

      const result = await service.getAttributeByResourceAndField('1', 'nonexistent');

      expect(mockAttributeRepository.findOne).toHaveBeenCalledWith({
        where: { resourceId: '1', fieldName: 'nonexistent' },
      });
      expect(result).toBeNull();
    });
  });
});
