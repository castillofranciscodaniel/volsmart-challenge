import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { ABACUnifiedInterceptor } from './abac-unified.interceptor';
import { ABACService } from '../../core/services/abac.service';
import { AdaptersModule } from '../../adapters/adapters.module';

@Module({
  imports: [
    AdaptersModule, // Importar AdaptersModule para tener acceso a ABAC_REPOSITORY y USER_REPOSITORY
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [RolesGuard, ABACUnifiedInterceptor, ABACService],
  exports: [RolesGuard, JwtModule, ABACUnifiedInterceptor, ABACService]
})
export class SecurityModule {}
