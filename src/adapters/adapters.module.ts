import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollRepositoryImpl } from './payroll.repository.impl';
import { UserRepositoryImpl } from './user.repository.impl';
import { RoleRepositoryImpl } from './role.repository.impl';
import { ABACRepositoryImpl } from './abac.repository.impl';
import { PAYROLL_REPOSITORY } from '../core/ports/payroll.repository.port';
import { USER_REPOSITORY } from '../core/ports/user.repository.port';
import { ROLE_REPOSITORY } from '../core/ports/role.repository.port';
import { ABAC_REPOSITORY } from '../core/ports/abac.repository.port';
import { PayrollEntity } from '../infraestructure/postgress/entities/payroll.entity';
import { UserEntity } from '../infraestructure/postgress/entities/user.entity';
import { RoleEntity } from '../infraestructure/postgress/entities/role.entity';
import { ResourceEntity } from '../infraestructure/postgress/entities/resource.entity';
import { AttributeEntity } from '../infraestructure/postgress/entities/attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollEntity, UserEntity, RoleEntity, ResourceEntity, AttributeEntity])
  ],
  providers: [
    { provide: PAYROLL_REPOSITORY, useClass: PayrollRepositoryImpl },
    { provide: USER_REPOSITORY, useClass: UserRepositoryImpl },
    { provide: ROLE_REPOSITORY, useClass: RoleRepositoryImpl },
    { provide: ABAC_REPOSITORY, useClass: ABACRepositoryImpl },
  ],
  exports: [PAYROLL_REPOSITORY, USER_REPOSITORY, ROLE_REPOSITORY, ABAC_REPOSITORY]
})
export class AdaptersModule {}

