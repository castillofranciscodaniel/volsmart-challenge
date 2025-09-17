import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ResourceEntity } from './resource.entity';

@Entity('attributes')
export class AttributeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // 'salary', 'email', 'amount', 'description'

  @Column({ name: 'field_name' })
  fieldName: string; // 'salary', 'email', 'amount', 'description'

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'is_sensitive', default: false })
  isSensitive: boolean; // true para campos sensibles como salary

  @ManyToOne(() => ResourceEntity, resource => resource.attributes)
  @JoinColumn({ name: 'resource_id' })
  resource: ResourceEntity;

  @Column({ name: 'resource_id' })
  resourceId: string;

}
