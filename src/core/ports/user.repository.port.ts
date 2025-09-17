import { UserModel } from '../models/user.model';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findById(id: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  findAll(): Promise<UserModel[]>;
  save(user: UserModel): Promise<UserModel>;
  delete(id: string): Promise<boolean>;
}
