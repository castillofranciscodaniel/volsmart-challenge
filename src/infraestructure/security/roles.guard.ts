import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { SetMetadata } from '@nestjs/common';
import type { UserRepositoryPort } from '../../core/ports/user.repository.port';
import { USER_REPOSITORY } from '../../core/ports/user.repository.port';
import { RoleType } from '../../core/models/user.model';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log('RolesGuard - Token payload:', payload);
      
      // Buscar el usuario completo en la base de datos
      const user = await this.userRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      request.user = user;
    } catch (error) {
      console.log('RolesGuard - Error:', error);
      throw new UnauthorizedException();
    }

    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    
    // Check if user has any of the required roles
    const userRoles = request.user.roles?.map((role: any) => role.name) || [];
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

