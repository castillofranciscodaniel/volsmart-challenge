import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../core/services/auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockLoginResult = {
    access_token: 'jwt-token',
    user: {
      id: '1',
      email: 'test@example.com',
      password: 'password123',
      role: {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator'
      },
      salary: 50000
    }
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user when login is successful', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123'
      };
      authService.login.mockResolvedValue(mockLoginResult);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockLoginResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should throw UnauthorizedException when login fails', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });
});
