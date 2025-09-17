import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import { UserModel } from '../models/user.model';
import { RoleModel } from '../models/user.model';
import { EncryptionService } from './encryption.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let jwtService: jest.Mocked<JwtService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  const mockUser: UserModel = {
    id: '1',
    email: 'test@example.com',
    password: 'password123',
    roles: [{
      id: '1',
      name: 'ADMIN',
      description: 'Administrator'
    }],
    salary: 50000
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn()
    };

    const mockEncryptionService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(USER_REPOSITORY);
    jwtService = module.get(JwtService);
    encryptionService = module.get(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const expectedToken = 'jwt-token';

      userRepository.findByEmail.mockResolvedValue(mockUser);
      encryptionService.comparePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(expectedToken);

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(result).toEqual({
        access_token: expectedToken,
        user: mockUser
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(encryptionService.comparePassword).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';

      userRepository.findByEmail.mockResolvedValue(mockUser);
      encryptionService.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no valid role', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const userWithoutRole = { ...mockUser, roles: [] };

      userRepository.findByEmail.mockResolvedValue(userWithoutRole as any);
      encryptionService.comparePassword.mockResolvedValue(true);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with correct payload', async () => {
      // Arrange
      const expectedToken = 'jwt-token';
      jwtService.sign.mockReturnValue(expectedToken);

      // Act
      const result = await service['generateToken'](mockUser);

      // Assert
      expect(result).toBe(expectedToken);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        roles: [{
          id: mockUser.roles[0].id,
          name: mockUser.roles[0].name,
          description: mockUser.roles[0].description,
        }],
        salary: mockUser.salary,
        iat: expect.any(Number)
      });
    });
  });
});
