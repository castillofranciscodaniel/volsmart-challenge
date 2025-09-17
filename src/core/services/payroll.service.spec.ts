import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PayrollRepositoryPort } from '../ports/payroll.repository.port';
import { PAYROLL_REPOSITORY } from '../ports/payroll.repository.port';
import { PayrollModel } from '../models/payroll.model';
import { ABACService } from './abac.service';

describe('PayrollService', () => {
  let service: PayrollService;
  let payrollRepository: jest.Mocked<PayrollRepositoryPort>;
  let abacService: jest.Mocked<ABACService>;

  const mockPayroll: PayrollModel = {
    id: '1',
    userId: '1',
    salary: 50000,
    period: '2024-01',
    createdAt: new Date()
  };

  beforeEach(async () => {
    const mockPayrollRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn()
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PAYROLL_REPOSITORY,
          useValue: mockPayrollRepository
        },
        {
          provide: ABACService,
          useValue: mockABACService
        }
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    payrollRepository = module.get(PAYROLL_REPOSITORY);
    abacService = module.get(ABACService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPayrollsForUser', () => {
    it('should return payrolls for user', async () => {
      // Arrange
      const userId = '1';
      const payrolls = [mockPayroll];
      payrollRepository.findByUserId.mockResolvedValue(payrolls);

      // Act
      const result = await service.getPayrollsForUser(userId);

      // Assert
      expect(result).toEqual(payrolls);
      expect(payrollRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when no payrolls found', async () => {
      // Arrange
      const userId = '999';
      payrollRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await service.getPayrollsForUser(userId);

      // Assert
      expect(result).toEqual([]);
      expect(payrollRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('createPayroll', () => {
    it('should create and return new payroll', async () => {
      // Arrange
      const newPayroll = { ...mockPayroll, id: '2' };
      payrollRepository.save.mockResolvedValue(newPayroll);

      // Act
      const result = await service.createPayroll(mockPayroll);

      // Assert
      expect(result).toEqual(newPayroll);
      expect(payrollRepository.save).toHaveBeenCalledWith(mockPayroll);
    });
  });
});
