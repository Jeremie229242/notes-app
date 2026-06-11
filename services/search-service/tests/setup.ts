// Fichier de configuration des tests

// Ce fichier s'exécute avant tous les tests

// Configuration de l'environnement de test
process.env.NODE_ENV = "test";
process.env.ELASTICSEARCH_URL = "http://localhost:9200";
process.env.ELASTICSEARCH_INDEX_PREFIX = "test_notesverb";

// Méthodes de console simulée pour réduire le bruit pendant les tests
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