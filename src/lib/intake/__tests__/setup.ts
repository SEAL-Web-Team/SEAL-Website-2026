// Deterministic env for every test file. Set before any module reads
// process.env at import time.
process.env.INTAKE_SESSION_SECRET = "test-secret-do-not-use-in-production";
