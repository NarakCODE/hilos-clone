// Jest configuration for @acw/api.
//
// - ts-jest compiles TypeScript (decorators enabled via tsconfig.spec.json).
// - `globalSetup` loads test env (TEST_DATABASE_URL / TEST_REDIS_URL) from the
//   repo `.env.example` defaults before the suite runs.
// - `setupFilesAfterEnv` wires reflect-metadata (NestJS DI) and fast-check
//   global settings for property-based tests.
//
// Run with: `pnpm --filter @acw/api test`
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
      },
    ],
  },
  globalSetup: "<rootDir>/test/global-setup.ts",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  clearMocks: true,
  // Test infra (DB/Redis) may take a moment to connect in integration tests.
  testTimeout: 30000,
};
