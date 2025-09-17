import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../../core/services/auth.service';
import { LoggerCustomService, LOG_LEVEL } from '../../core/services/logger-custom.service';

@Controller('auth')
export class AuthController {
  private readonly logger: LoggerCustomService = new LoggerCustomService(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    this.logger.info('LOGIN', LOG_LEVEL.INIT, 'Login request received', { email: loginDto.email });
    
    try {
      const result = await this.authService.login(loginDto.email, loginDto.password);
      this.logger.info('LOGIN', LOG_LEVEL.SUCCESS, 'Login request processed successfully', { 
        email: loginDto.email, 
        userId: result.user.id 
      });

      return result;
    } catch (error) {
      this.logger.logError('LOGIN', LOG_LEVEL.ERROR, error as Error, { email: loginDto.email });
      throw error;
    }
  }
}
