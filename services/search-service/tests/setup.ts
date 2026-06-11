// Test setup file
// This file runs before all tests

// Set test environment
process.env.NODE_ENV = "test";
process.env.ELASTICSEARCH_URL = "http://localhost:9200";
process.env.ELASTICSEARCH_INDEX_PREFIX = "test_notesverb";

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});