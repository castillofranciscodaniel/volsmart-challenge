import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoleType } from '../../../core/models/user.model';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: 'USER' })
  type: RoleType;

  @ManyToMany(() => UserEntity, user => user.roles)
  users: UserEntity[];
}
