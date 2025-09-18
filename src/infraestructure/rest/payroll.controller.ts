import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PayrollService } from '../../core/services/payroll.service';
import { RolesGuard } from '../security/roles.guard';
import { UseABAC } from '../security/abac.decorator';
import { PayrollModel } from '../../core/models/payroll.model';
import { LoggerCustomService, LOG_LEVEL } from '../../core/services/logger-custom.service';

@Controller('payrolls')
export class PayrollController {
  private readonly logger: LoggerCustomService = new LoggerCustomService(PayrollController.name);

  constructor(private readonly payrollService: PayrollService) {}

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @UseABAC()
  async getPayrollsByUser(@Req() req, @Param('userId') userId: string) {
    this.logger.info('GET', LOG_LEVEL.INIT, 'Get payrolls request received', {
      userId, 
      requestingUserId: req.user?.id 
    });
    
    try {
      const requestingUser = req.user;

      const userRoles = requestingUser.roles?.map(role => role.name) || [];
      const isAdmin = userRoles.includes('ADMIN');
      const isManager = userRoles.includes('MANAGER');
      const isUser = userRoles.includes('USER');
      
      // Permitir acceso si es ADMIN, MANAGER, o si es USER (pueden ver todos los payrolls para simplicidad)
      if (!isAdmin && !isManager && !isUser) {
        this.logger.info('GET', LOG_LEVEL.ERROR, 'Access denied for payroll request', {
          userId, 
          requestingUserId: requestingUser.id, 
          roles: userRoles 
        });

        return { statusCode: 403, message: 'Forbidden' };
      }
      
      const payrolls = await this.payrollService.getPayrollsForUser(userId);

      this.logger.info('GET', LOG_LEVEL.SUCCESS, 'Payrolls retrieved successfully', {
        userId, 
        count: payrolls.length 
      });

      return payrolls;
    } catch (error) {
      this.logger.logError('GET', LOG_LEVEL.ERROR, error as Error, { userId });
      throw error;
    }
  }

  @Post()
  @UseGuards(RolesGuard)
  @UseABAC()
  async create(@Req() req, @Body() payroll: PayrollModel) {
    this.logger.info('CREATE', LOG_LEVEL.INIT, 'Create payroll request received', {
      userId: payroll.userId, 
      requestingUserId: req.user?.id 
    });
    
    try {
      const userRoles = req.user.roles?.map(role => role.name) || [];
      const isAdmin = userRoles.includes('ADMIN');
      const isManager = userRoles.includes('MANAGER');
      
      if (!isAdmin && !isManager) {
        this.logger.info('CREATE', LOG_LEVEL.ERROR, 'Access denied for payroll creation', {
          requestingUserId: req.user.id, 
          roles: userRoles 
        });

        return { statusCode: 403, message: 'Forbidden' };
      }
      
      const createdPayroll = await this.payrollService.createPayroll(payroll);

      this.logger.info('CREATE', LOG_LEVEL.SUCCESS, 'Payroll created successfully', {
        id: createdPayroll.id, 
        userId: createdPayroll.userId 
      });

      return createdPayroll;
    } catch (error) {
      this.logger.logError('CREATE', LOG_LEVEL.ERROR, error as Error, { userId: payroll.userId });
      throw error;
    }
  }
}
