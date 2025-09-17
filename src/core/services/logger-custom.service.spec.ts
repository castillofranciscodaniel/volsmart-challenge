import { LoggerCustomService, LOG_LEVEL } from './logger-custom.service';

describe('LoggerCustomService', () => {
  let logger: LoggerCustomService;

  beforeEach(() => {
    logger = new LoggerCustomService('TestService');
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  describe('info', () => {
    it('should log info message with correct format', () => {
      // Arrange
      const methodName = 'TEST_METHOD';
      const level = LOG_LEVEL.INIT;
      const message = 'Test message';
      const context = { userId: '1' };

      // Mock the parent Logger's log method
      const logSpy = jest.spyOn(logger, 'log').mockImplementation();

      // Act
      logger.info(methodName, level, message, context);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `[${methodName}] ${level} - ${message}`,
        JSON.stringify(context, null, 2)
      );

      logSpy.mockRestore();
    });

    it('should log info message without context', () => {
      // Arrange
      const methodName = 'TEST_METHOD';
      const level = LOG_LEVEL.SUCCESS;
      const message = 'Test message without context';

      // Mock the parent Logger's log method
      const logSpy = jest.spyOn(logger, 'log').mockImplementation();

      // Act
      logger.info(methodName, level, message);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `[${methodName}] ${level} - ${message}`
      );

      logSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should log error message with correct format', () => {
      // Arrange
      const methodName = 'TEST_METHOD';
      const level = LOG_LEVEL.ERROR;
      const error = new Error('Test error');
      const context = { userId: '1' };

      // Mock console.error to capture output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      logger.logError(methodName, level, error, context);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `[${methodName}] ${level} - ${error.message}`,
        error.stack,
        JSON.stringify(context, null, 2)
      );

      consoleSpy.mockRestore();
    });

    it('should log error message without context', () => {
      // Arrange
      const methodName = 'TEST_METHOD';
      const level = LOG_LEVEL.ERROR;
      const error = new Error('Test error without context');

      // Mock console.error to capture output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      logger.logError(methodName, level, error);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `[${methodName}] ${level} - ${error.message}`,
        error.stack
      );

      consoleSpy.mockRestore();
    });
  });

  describe('warn', () => {
    it('should log warning message with correct format', () => {
      // Arrange
      const methodName = 'TEST_METHOD';
      const level = LOG_LEVEL.WARN;
      const message = 'Test warning message';
      const context = { userId: '1' };

      // Mock console.warn to capture output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      logger.warn(methodName, level, message, context);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `[${methodName}] ${level} - ${message}`,
        JSON.stringify(context, null, 2)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('debug', () => {
    it('should log debug message with correct format', () => {
      // Arrange
      const methodName = 'TEST_METHOD';
      const level = LOG_LEVEL.DEBUG;
      const message = 'Test debug message';
      const context = { userId: '1' };

      // Mock console.debug to capture output
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Act
      logger.debug(methodName, level, message, context);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `[${methodName}] ${level} - ${message}`,
        JSON.stringify(context, null, 2)
      );

      consoleSpy.mockRestore();
    });
  });
});
