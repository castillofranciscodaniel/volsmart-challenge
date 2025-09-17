import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('payrolls')
export class PayrollEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'float' })
  salary: number;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @CreateDateColumn()
  createdAt: Date;
}

