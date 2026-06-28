// Per-test-file setup (runs after the test framework is installed).
//
// - `reflect-metadata` is required for NestJS dependency injection and for
//   resolving decorator metadata in unit tests that build modules.
// - fast-check global settings keep property-based test output deterministic
//   and report the seed/path on failure for reproducible counterexamples.
import "reflect-metadata";
import * as fc from "fast-check";
import { loadTestEnv } from "./test-env";

loadTestEnv();

fc.configureGlobal({
  // Reasonable run count for CI; `verbose` surfaces shrunk counterexamples.
  numRuns: 100,
  verbose: true,
});
