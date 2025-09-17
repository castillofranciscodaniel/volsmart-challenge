import { Injectable, Inject } from '@nestjs/common';
import { PAYROLL_REPOSITORY } from '../ports/payroll.repository.port';
import type { PayrollRepositoryPort } from '../ports/payroll.repository.port';
import { PayrollModel } from '../models/payroll.model';
import { UserModel } from '../models/user.model';
import { LoggerCustomService, LOG_LEVEL } from './logger-custom.service';

@Injectable()
export class PayrollService {
  private readonly logger: LoggerCustomService = new LoggerCustomService(PayrollService.name);

  constructor(
    @Inject(PAYROLL_REPOSITORY) private readonly payrollRepo: PayrollRepositoryPort,
  ) {}

  async getPayrollsForUser(userId: string): Promise<PayrollModel[]> {
    this.logger.info('GET_PAYROLLS_FOR_USER', LOG_LEVEL.INIT, 'Getting payrolls for user', { userId });
    
    try {
      const payrolls = await this.payrollRepo.findByUserId(userId);

      this.logger.info('GET_PAYROLLS_FOR_USER', LOG_LEVEL.SUCCESS, 'Payrolls retrieved for user', { 
        userId, 
        count: payrolls.length 
      });

      return payrolls;
    } catch (error) {
      this.logger.logError('GET_PAYROLLS_FOR_USER', LOG_LEVEL.ERROR, error as Error, { userId });
      throw error;
    }
  }

  async createPayroll(payroll: PayrollModel): Promise<PayrollModel> {
    this.logger.info('CREATE_PAYROLL', LOG_LEVEL.INIT, 'Creating new payroll', { 
      userId: payroll.userId, 
      salary: payroll.salary, 
      period: payroll.period 
    });
    
    try {
      const savedPayroll = await this.payrollRepo.save(payroll);

      this.logger.info('CREATE_PAYROLL', LOG_LEVEL.SUCCESS, 'Payroll created successfully', { 
        id: savedPayroll.id, 
        userId: savedPayroll.userId 
      });

      return savedPayroll;
    } catch (error) {
      this.logger.logError('CREATE_PAYROLL', LOG_LEVEL.ERROR, error as Error, { userId: payroll.userId });
      throw error;
    }
  }
}
