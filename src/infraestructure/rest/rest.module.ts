import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PayrollController } from './payroll.controller';
import { UserController } from './user.controller';
import { RoleController } from './role.controller';
import { CoreServicesModule } from '../../core/services/core-services.module';
import { SecurityModule } from '../security/security.module';
import { AdaptersModule } from '../../adapters/adapters.module';

@Module({
  imports: [CoreServicesModule, SecurityModule, AdaptersModule],
  controllers: [AuthController, PayrollController, UserController, RoleController]
})
export class RestModule {}

