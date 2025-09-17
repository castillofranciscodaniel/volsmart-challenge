import { PayrollModel } from '../models/payroll.model';

export const PAYROLL_REPOSITORY = Symbol('PAYROLL_REPOSITORY');

export interface PayrollRepositoryPort {
  findById(id: string): Promise<PayrollModel | null>;
  findByUserId(userId: string): Promise<PayrollModel[]>;
  save(payroll: PayrollModel): Promise<PayrollModel>;
}
