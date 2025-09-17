import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceEntity } from '../infraestructure/postgress/entities/resource.entity';
import { AttributeEntity } from '../infraestructure/postgress/entities/attribute.entity';
import { ABACRepositoryPort } from '../core/ports/abac.repository.port';
import { ResourceModel, AttributeModel } from '../core/models/abac.model';
import { PermissionLevel, PermissionType } from '../core/constants/permission.types';

@Injectable()
export class ABACRepositoryImpl implements ABACRepositoryPort {
  constructor(
    @InjectRepository(ResourceEntity)
    private readonly resourceRepo: Repository<ResourceEntity>,
    @InjectRepository(AttributeEntity)
    private readonly attributeRepo: Repository<AttributeEntity>,
  ) {}

  // Métodos para obtener permisos (usando JSON en resources)

  // Métodos para administrar recursos
  async createResource(resource: ResourceModel): Promise<ResourceModel> {
    const entity = this.toResourceEntity(resource);
    const saved = await this.resourceRepo.save(entity);

    return this.toResourceModel(saved);
  }

  async getResources(): Promise<ResourceModel[]> {
    const entities = await this.resourceRepo.find();

    return entities.map(e => this.toResourceModel(e));
  }

  async getResourceByName(name: string): Promise<ResourceModel | null> {
    const entity = await this.resourceRepo.findOne({ where: { name } });

    if (!entity) return null;

    // Usar directamente el JSON role_permissions de la BD
    return this.toResourceModel(entity);
  }



  // Métodos para administrar atributos
  async createAttribute(attribute: AttributeModel): Promise<AttributeModel> {
    const entity = this.toAttributeEntity(attribute);
    const saved = await this.attributeRepo.save(entity);

    return this.toAttributeModel(saved);
  }

  async getAttributesByResource(resourceId: string): Promise<AttributeModel[]> {
    const entities = await this.attributeRepo.find({ where: { resourceId } });

    return entities.map(e => this.toAttributeModel(e));
  }

  async getAttributeByResourceAndField(resourceId: string, fieldName: string): Promise<AttributeModel | null> {
    const entity = await this.attributeRepo.findOne({ 
      where: { resourceId, fieldName } 
    });

    return entity ? this.toAttributeModel(entity) : null;
  }


  // Métodos de conversión
  private toResourceModel(entity: ResourceEntity): ResourceModel {
    return {
      id: entity.id,
      name: entity.name,
      tableName: entity.tableName,
      description: entity.description,
      rolePermissions: entity.rolePermissions,
    };
  }

  private toResourceEntity(model: ResourceModel): ResourceEntity {
    const entity = new ResourceEntity();
    entity.id = model.id;
    entity.name = model.name;
    entity.tableName = model.tableName;
    entity.description = model.description;
    entity.rolePermissions = model.rolePermissions;

    return entity;
  }

  private toAttributeModel(entity: AttributeEntity): AttributeModel {
    return {
      id: entity.id,
      name: entity.name,
      fieldName: entity.fieldName,
      description: entity.description,
      isSensitive: entity.isSensitive,
      resourceId: entity.resourceId,
    };
  }

  private toAttributeEntity(model: AttributeModel): AttributeEntity {
    const entity = new AttributeEntity();
    entity.id = model.id;
    entity.name = model.name;
    entity.fieldName = model.fieldName;
    entity.description = model.description;
    entity.isSensitive = model.isSensitive;
    entity.resourceId = model.resourceId;

    return entity;
  }

}
