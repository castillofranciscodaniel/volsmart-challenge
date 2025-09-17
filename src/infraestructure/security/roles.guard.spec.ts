import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { USER_REPOSITORY } from '../../core/ports/user.repository.port';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<any>;

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer valid-token'
        },
        user: {
          id: '1',
          email: 'test@example.com',
          roles: [{
            id: '1',
            name: 'ADMIN',
            description: 'Administrator'
          }]
        }
      })
    }),
    getHandler: jest.fn(),
    getClass: jest.fn()
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn()
    };

    const mockJwtService = {
      verify: jest.fn()
    };

    const mockUserRepository = {
      findById: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository
        }
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
    jwtService = module.get(JwtService);
    userRepository = module.get(USER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when user has required role', async () => {
      // Arrange
      const requiredRoles = ['ADMIN', 'MANAGER'];
      reflector.get.mockReturnValue(requiredRoles);
      jwtService.verify.mockReturnValue({
        sub: '1',
        email: 'test@example.com',
        roles: [{ name: 'ADMIN' }]
      });
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: [{ name: 'ADMIN' }]
      };
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith('roles', mockExecutionContext.getHandler());
    });

    it('should return false when user does not have required role', async () => {
      // Arrange
      const requiredRoles = ['MANAGER'];
      reflector.get.mockReturnValue(requiredRoles);
      jwtService.verify.mockReturnValue({
        sub: '1',
        email: 'test@example.com',
        roles: [{ name: 'USER' }]
      });
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: [{ name: 'USER' }]
      };
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when user has multiple roles and one matches required role', async () => {
      // Arrange
      const requiredRoles = ['MANAGER'];
      reflector.get.mockReturnValue(requiredRoles);
      jwtService.verify.mockReturnValue({
        sub: '1',
        email: 'test@example.com',
        roles: [{ name: 'USER' }, { name: 'MANAGER' }]
      });
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: [{ name: 'USER' }, { name: 'MANAGER' }]
      };
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when no roles are required', async () => {
      // Arrange
      reflector.get.mockReturnValue(undefined);
      jwtService.verify.mockReturnValue({
        sub: '1',
        email: 'test@example.com',
        roles: [{ name: 'ADMIN' }]
      });
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: [{ name: 'ADMIN' }]
      };
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no token provided', () => {
      // Arrange
      const contextWithoutToken = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {}
          })
        }),
        getHandler: jest.fn()
      } as unknown as ExecutionContext;

      const requiredRoles = ['ADMIN'];
      reflector.get.mockReturnValue(requiredRoles);

      // Act & Assert
      expect(async () => await guard.canActivate(contextWithoutToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      // Arrange
      const contextWithInvalidToken = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token'
            }
          })
        }),
        getHandler: jest.fn()
      } as unknown as ExecutionContext;

      const requiredRoles = ['ADMIN'];
      reflector.get.mockReturnValue(requiredRoles);
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(async () => await guard.canActivate(contextWithInvalidToken)).rejects.toThrow(UnauthorizedException);
    });
  });
});
