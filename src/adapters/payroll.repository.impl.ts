import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollEntity } from '../infraestructure/postgress/entities/payroll.entity';
import { PayrollModel } from '../core/models/payroll.model';
import { PayrollRepositoryPort } from '../core/ports/payroll.repository.port';
import { LoggerCustomService, LOG_LEVEL } from '../core/services/logger-custom.service';

@Injectable()
export class PayrollRepositoryImpl implements PayrollRepositoryPort {
  private readonly logger: LoggerCustomService = new LoggerCustomService(PayrollRepositoryImpl.name);

  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepo: Repository<PayrollEntity>,
  ) {}

  private toModel(entity: PayrollEntity): PayrollModel {
    const { user, ...payrollData } = entity;
    return {
      ...payrollData,
      userId: user?.id || (entity as any).user_id,
    };
  }

  private toEntity(model: PayrollModel): PayrollEntity {
    const { userId, ...payrollData } = model;
    return {
      ...new PayrollEntity(),
      ...payrollData,
      user: { id: userId } as any,
    };
  }

  async findById(id: string): Promise<PayrollModel | null> {
    this.logger.info('FIND_BY_ID', LOG_LEVEL.INIT, 'Finding payroll by ID in repository', { id });
    
    try {
      const entity = await this.payrollRepo.findOne({ where: { id }, relations: ['user'] });
      const found = !!entity;
      this.logger.info('FIND_BY_ID', LOG_LEVEL.SUCCESS, 'Payroll found by ID in repository', { id, found });

      return entity ? this.toModel(entity) : null;
    } catch (error) {
      this.logger.logError('FIND_BY_ID', LOG_LEVEL.ERROR, error as Error, { id });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<PayrollModel[]> {
    this.logger.info('GET_PAYROLLS_FOR_USER', LOG_LEVEL.INIT, 'Finding payrolls by user ID in repository', { userId });
    
    try {
      const entities = await this.payrollRepo
        .createQueryBuilder('payroll')
        .where('payroll.user_id = :userId', { userId })
        .getMany();
      
      this.logger.info('GET_PAYROLLS_FOR_USER', LOG_LEVEL.INFO, 'Raw entities found', { 
        userId, 
        entityCount: entities.length,
        entities: entities.map(e => ({ id: e.id, userId: e.user?.id, salary: e.salary, period: e.period }))
      });
      
      const payrolls = entities.map(entity => this.toModel(entity));

      this.logger.info('GET_PAYROLLS_FOR_USER', LOG_LEVEL.SUCCESS, 'Payrolls found by user ID in repository', { 
        userId, 
        count: payrolls.length 
      });

      return payrolls;
    } catch (error) {
      this.logger.logError('GET_PAYROLLS_FOR_USER', LOG_LEVEL.ERROR, error as Error, { userId });
      throw error;
    }
  }

  async save(payroll: PayrollModel): Promise<PayrollModel> {
    this.logger.info('CREATE_PAYROLL', LOG_LEVEL.INIT, 'Saving payroll in repository', { 
      id: payroll.id, 
      userId: payroll.userId 
    });
    
    try {
      const entity = this.toEntity(payroll);
      const saved = await this.payrollRepo.save(entity);
      const savedPayroll = this.toModel(saved);

      this.logger.info('CREATE_PAYROLL', LOG_LEVEL.SUCCESS, 'Payroll saved in repository', { 
        id: savedPayroll.id, 
        userId: savedPayroll.userId 
      });

      return savedPayroll;
    } catch (error) {
      this.logger.logError('CREATE_PAYROLL', LOG_LEVEL.ERROR, error as Error, { 
        id: payroll.id, 
        userId: payroll.userId 
      });
      throw error;
    }
  }
}
