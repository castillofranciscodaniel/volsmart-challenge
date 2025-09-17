// Global test setup
import 'reflect-metadata';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Set test timeout
jest.setTimeout(10000);
