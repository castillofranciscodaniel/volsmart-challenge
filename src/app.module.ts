import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infraestructure/postgress/entities/user.entity';
import { PayrollEntity } from './infraestructure/postgress/entities/payroll.entity';
import { RoleEntity } from './infraestructure/postgress/entities/role.entity';
import { ResourceEntity } from './infraestructure/postgress/entities/resource.entity';
import { AttributeEntity } from './infraestructure/postgress/entities/attribute.entity';
import { AdaptersModule } from './adapters/adapters.module';
import { CoreServicesModule } from './core/services/core-services.module';
import { RestModule } from './infraestructure/rest/rest.module';
import { SecurityModule } from './infraestructure/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: 5432,
      username: process.env.DB_USER || 'nestuser',
      password: process.env.DB_PASS || 'nestpass',
      database: process.env.DB_NAME || 'nestdb',
      entities: [UserEntity, PayrollEntity, RoleEntity, ResourceEntity, AttributeEntity],
      synchronize: false, // Desactivar temporalmente
    }),
    TypeOrmModule.forFeature([UserEntity, PayrollEntity, RoleEntity, ResourceEntity, AttributeEntity]),
    AdaptersModule,
    CoreServicesModule,
    RestModule,
    SecurityModule,
  ],
})
export class AppModule {}
