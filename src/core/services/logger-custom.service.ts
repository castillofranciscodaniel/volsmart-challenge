import { Injectable, Logger } from '@nestjs/common';

export enum LOG_LEVEL {
  INIT = 'INIT',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

@Injectable()
export class LoggerCustomService extends Logger {
  constructor(context: string) {
    super(context);
  }

  info(methodName: string, level: LOG_LEVEL, message?: string, data?: any) {
    const logMessage = `[${methodName}] ${level}${message ? ` - ${message}` : ''}`;
    if (data) {
      this.log(logMessage, JSON.stringify(data, null, 2));
    } else {
      this.log(logMessage);
    }
  }

  logError(methodName: string, level: LOG_LEVEL, error: Error | string, data?: any) {
    const logMessage = `[${methodName}] ${level} - ${typeof error === 'string' ? error : error.message}`;
    if (data) {
      console.error(logMessage, error instanceof Error ? error.stack : '', JSON.stringify(data, null, 2));
    } else {
      console.error(logMessage, error instanceof Error ? error.stack : '');
    }
  }

  warn(methodName: string, level: LOG_LEVEL, message?: string, data?: any) {
    const logMessage = `[${methodName}] ${level}${message ? ` - ${message}` : ''}`;
    if (data) {
      console.warn(logMessage, JSON.stringify(data, null, 2));
    } else {
      console.warn(logMessage);
    }
  }

  debug(methodName: string, level: LOG_LEVEL, message?: string, data?: any) {
    const logMessage = `[${methodName}] ${level}${message ? ` - ${message}` : ''}`;
    if (data) {
      console.debug(logMessage, JSON.stringify(data, null, 2));
    } else {
      console.debug(logMessage);
    }
  }
}
