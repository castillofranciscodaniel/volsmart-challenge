import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testpassword123';
      const hashedPassword = '$2b$10$hashedpassword123';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = '$2b$10$emptyhashed';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle special characters in password', async () => {
      const password = 'test@#$%^&*()_+{}|:"<>?[]\\;\',./';
      const hashedPassword = '$2b$10$specialchars';

      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hashPassword(password);

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = '$2b$10$hashedpassword123';

      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'wrongpassword';
      const hashedPassword = '$2b$10$hashedpassword123';

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hashedPassword = '$2b$10$hashedpassword123';

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty hashed password', async () => {
      const password = 'testpassword123';
      const hashedPassword = '';

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });
});
