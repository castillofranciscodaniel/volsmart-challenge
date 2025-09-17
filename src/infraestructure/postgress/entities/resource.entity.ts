import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AttributeEntity } from './attribute.entity';
import { PermissionLevel } from '../../../core/constants/permission.types';

@Entity('resources')
export class ResourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 'users', 'payrolls', 'roles'

  @Column({ name: 'table_name' })
  tableName: string; // 'users', 'payrolls', 'roles'

  @Column({ nullable: true })
  description?: string;

  // Nuevos campos para permisos de rol
  @Column({ name: 'role_permissions', type: 'jsonb', nullable: true })
  rolePermissions?: {
    [roleName: string]: {
      canRead: PermissionLevel;
      canWrite: PermissionLevel;
      canDelete: PermissionLevel;
    }
  };

  @OneToMany(() => AttributeEntity, attribute => attribute.resource)
  attributes: AttributeEntity[];
}
