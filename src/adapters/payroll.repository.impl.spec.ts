import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRepositoryImpl } from './payroll.repository.impl';
import { PayrollEntity } from '../infraestructure/postgress/entities/payroll.entity';
import { PayrollModel } from '../core/models/payroll.model';

describe('PayrollRepositoryImpl', () => {
  let repository: PayrollRepositoryImpl;
  let payrollEntityRepository: jest.Mocked<Repository<PayrollEntity>>;

  const mockPayrollModel: PayrollModel = {
    id: '1',
    userId: '1',
    salary: 50000,
    period: '2024-01',
    createdAt: new Date()
  };

  const mockPayrollEntity: PayrollEntity = {
    id: '1',
    salary: 50000,
    period: '2024-01',
    createdAt: new Date(),
    user: {
      id: '1'
    } as any
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    };

    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollRepositoryImpl,
        {
          provide: getRepositoryToken(PayrollEntity),
          useValue: mockRepository
        }
      ],
    }).compile();

    repository = module.get<PayrollRepositoryImpl>(PayrollRepositoryImpl);
    payrollEntityRepository = module.get(getRepositoryToken(PayrollEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return payroll model when entity found', async () => {
      // Arrange
      const payrollId = '1';
      payrollEntityRepository.findOne.mockResolvedValue(mockPayrollEntity);

      // Act
      const result = await repository.findById(payrollId);

      // Assert
      expect(result).toEqual(mockPayrollModel);
      expect(payrollEntityRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: payrollId }, 
        relations: ['user'] 
      });
    });

    it('should return null when entity not found', async () => {
      // Arrange
      const payrollId = '999';
      payrollEntityRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(payrollId);

      // Assert
      expect(result).toBeNull();
      expect(payrollEntityRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: payrollId }, 
        relations: ['user'] 
      });
    });
  });

  describe('findByUserId', () => {
    it('should return array of payroll models for user', async () => {
      // Arrange
      const userId = '1';
      const entities = [mockPayrollEntity];
      const mockQueryBuilder = payrollEntityRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(entities);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toEqual([mockPayrollModel]);
      expect(payrollEntityRepository.createQueryBuilder).toHaveBeenCalledWith('payroll');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('payroll.user_id = :userId', { userId });
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return empty array when no payrolls found for user', async () => {
      // Arrange
      const userId = '999';
      const mockQueryBuilder = payrollEntityRepository.createQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toEqual([]);
      expect(payrollEntityRepository.createQueryBuilder).toHaveBeenCalledWith('payroll');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('payroll.user_id = :userId', { userId });
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save and return payroll model', async () => {
      // Arrange
      const savedEntity = { ...mockPayrollEntity, id: '2' };
      payrollEntityRepository.save.mockResolvedValue(savedEntity);

      // Act
      const result = await repository.save(mockPayrollModel);

      // Assert
      expect(result).toEqual({ ...mockPayrollModel, id: '2' });
      expect(payrollEntityRepository.save).toHaveBeenCalled();
    });
  });
});
