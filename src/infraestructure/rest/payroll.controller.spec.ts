import { Test, TestingModule } from '@nestjs/testing';
import { PayrollController } from './payroll.controller';
import { PayrollService } from '../../core/services/payroll.service';
import { RolesGuard } from '../security/roles.guard';
import { UseABAC } from '../security/abac.decorator';
import { ABACUnifiedInterceptor } from '../security/abac-unified.interceptor';
import { PayrollModel } from '../../core/models/payroll.model';

describe('PayrollController', () => {
  let controller: PayrollController;
  let payrollService: jest.Mocked<PayrollService>;

  const mockPayroll: PayrollModel = {
    id: '1',
    userId: '1',
    salary: 50000,
    period: '2024-01',
    createdAt: new Date()
  };

  const mockRequest = {
    user: {
      id: '1',
      email: 'test@example.com',
      roles: [{
        id: '1',
        name: 'ADMIN',
        description: 'Administrator'
      }]
    }
  };

  beforeEach(async () => {
    const mockPayrollService = {
      getPayrollsForUser: jest.fn(),
      createPayroll: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: mockPayrollService
        }
      ],
    })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .overrideInterceptor(ABACUnifiedInterceptor)
    .useValue({ intercept: (context, next) => next.handle() })
    .compile();

    controller = module.get<PayrollController>(PayrollController);
    payrollService = module.get(PayrollService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPayrolls', () => {
    it('should return payrolls for user when user is ADMIN', async () => {
      // Arrange
      const userId = '1';
      const payrolls = [mockPayroll];
      payrollService.getPayrollsForUser.mockResolvedValue(payrolls);

      // Act
      const result = await controller.get(mockRequest, userId);

      // Assert
      expect(result).toEqual(payrolls);
      expect(payrollService.getPayrollsForUser).toHaveBeenCalledWith(userId);
    });

    it('should return payrolls for user when user requests their own data', async () => {
      // Arrange
      const userId = '1';
      const payrolls = [mockPayroll];
      const userRequest = {
        user: {
          id: '1',
          email: 'test@example.com',
          roles: [{
            id: '2',
            name: 'USER',
            description: 'User'
          }]
        }
      };
      payrollService.getPayrollsForUser.mockResolvedValue(payrolls);

      // Act
      const result = await controller.get(userRequest, userId);

      // Assert
      expect(result).toEqual(payrolls);
      expect(payrollService.getPayrollsForUser).toHaveBeenCalledWith(userId);
    });

    it('should return payrolls when user is USER (has access)', async () => {
      // Arrange
      const userId = '2';
      const payrolls = [mockPayroll];
      const userRequest = {
        user: {
          id: '1',
          email: 'test@example.com',
          roles: [{
            id: '2',
            name: 'USER',
            description: 'User'
          }]
        }
      };
      payrollService.getPayrollsForUser.mockResolvedValue(payrolls);

      // Act
      const result = await controller.get(userRequest, userId);

      // Assert
      expect(result).toEqual(payrolls);
      expect(payrollService.getPayrollsForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('createPayroll', () => {
    it('should create payroll when user is ADMIN', async () => {
      // Arrange
      const newPayroll = { ...mockPayroll, id: '2' };
      payrollService.createPayroll.mockResolvedValue(newPayroll);

      // Act
      const result = await controller.create(mockRequest, mockPayroll);

      // Assert
      expect(result).toEqual(newPayroll);
      expect(payrollService.createPayroll).toHaveBeenCalledWith(mockPayroll);
    });

    it('should return 403 when user is not ADMIN', async () => {
      // Arrange
      const userRequest = {
        user: {
          id: '1',
          email: 'test@example.com',
          roles: [{
            id: '2',
            name: 'USER',
            description: 'User'
          }]
        }
      };

      // Act
      const result = await controller.create(userRequest, mockPayroll);

      // Assert
      expect(result).toEqual({ statusCode: 403, message: 'Forbidden' });
      expect(payrollService.createPayroll).not.toHaveBeenCalled();
    });
  });
});
