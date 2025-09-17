import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { PayrollService } from './payroll.service';
import { AuthService } from './auth.service';
import { RoleService } from './role.service';
import { ABACService } from './abac.service';
import { EncryptionService } from './encryption.service';
import { AdaptersModule } from '../../adapters/adapters.module';

@Module({
  imports: [
    AdaptersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [UserService, PayrollService, AuthService, RoleService, ABACService, EncryptionService],
  exports: [UserService, PayrollService, AuthService, RoleService, ABACService, EncryptionService]
})
export class CoreServicesModule {}

