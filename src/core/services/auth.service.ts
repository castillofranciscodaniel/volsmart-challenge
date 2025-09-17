import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserModel } from '../models/user.model';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import type { UserRepositoryPort } from '../ports/user.repository.port';
import { LoggerCustomService, LOG_LEVEL } from './logger-custom.service';
import { EncryptionService } from './encryption.service';

@Injectable()
export class AuthService {
  private readonly logger: LoggerCustomService = new LoggerCustomService(AuthService.name);

  constructor(
    private jwtService: JwtService,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    private readonly encryptionService: EncryptionService,
  ) {}

  async login(email: string, password: string): Promise<{ access_token: string; user: UserModel }> {
    this.logger.info('LOGIN', LOG_LEVEL.INIT, 'Starting user login process', { email });
    
    try {
      const user = await this.userRepo.findByEmail(email);
      this.logger.info('LOGIN', LOG_LEVEL.INFO, 'User lookup completed', { userId: user?.id, found: !!user });
      
      if (!user) {
        this.logger.logError('LOGIN', LOG_LEVEL.ERROR, 'User not found', { email });
        throw new UnauthorizedException('User not found');
      }

      // Check if user has encrypted password or testing password
      const isValidPassword = user.passwordForTesting 
        ? user.passwordForTesting === password 
        : await this.encryptionService.comparePassword(password, user.password);
        
      if (!isValidPassword) {
        this.logger.logError('LOGIN', LOG_LEVEL.ERROR, 'Invalid password', { email, userId: user.id });
        throw new UnauthorizedException('Invalid password');
      }

      if (!user.roles || user.roles.length === 0) {
        this.logger.logError('LOGIN', LOG_LEVEL.ERROR, 'User has no valid role', { email, userId: user.id, roles: user.roles });
        throw new UnauthorizedException('User has no valid role');
      }

      const token = await this.generateToken(user);
      this.logger.info('LOGIN', LOG_LEVEL.SUCCESS, 'Login successful', { 
        email, 
        userId: user.id, 
        role: user.roles[0].name 
      });
      
      return {
        access_token: token,
        user: user
      };
    } catch (error) {
      this.logger.logError('LOGIN', LOG_LEVEL.ERROR, error as Error, { email });
      throw error;
    }
  }

  private async generateToken(user: UserModel): Promise<string> {
    this.logger.info('GENERATE_TOKEN', LOG_LEVEL.INIT, 'Generating JWT token', { userId: user.id, email: user.email });
    
    try {
      const payload = {
        sub: user.id,
        email: user.email,
        roles: user.roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })),
        salary: user.salary,
        iat: Math.floor(Date.now() / 1000),
      };
      
      const token = this.jwtService.sign(payload);
      this.logger.info('GENERATE_TOKEN', LOG_LEVEL.SUCCESS, 'JWT token generated successfully', { userId: user.id });
      
      return token;
    } catch (error) {
      this.logger.logError('GENERATE_TOKEN', LOG_LEVEL.ERROR, error as Error, { userId: user.id });
      throw error;
    }
  }
}
