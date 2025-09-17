import { ResourceModel, AttributeModel } from '../models/abac.model';

export const ABAC_REPOSITORY = Symbol('ABAC_REPOSITORY');

export interface ABACRepositoryPort {
  // Métodos para administrar recursos
  createResource(resource: ResourceModel): Promise<ResourceModel>;
  getResources(): Promise<ResourceModel[]>;
  getResourceByName(name: string): Promise<ResourceModel | null>;

  // Métodos para administrar atributos
  createAttribute(attribute: AttributeModel): Promise<AttributeModel>;
  getAttributesByResource(resourceId: string): Promise<AttributeModel[]>;
  getAttributeByResourceAndField(resourceId: string, fieldName: string): Promise<AttributeModel | null>;
}
