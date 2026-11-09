When you write acceptance criteria for a feature, or an E2E spec in `packages/tests-e2e`, apply the checklist under "What to test" in `packages/tests-e2e/README.md`.
Mark each item that applies as ``E2E: `<test title>` `` or `no-e2e: <reason>`. Never leave an item out without a reason.
A list gets one table test (pagination, filters and search together, scoped to the spec's unique prefix), not one test for each.
