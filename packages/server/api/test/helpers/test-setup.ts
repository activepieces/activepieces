import { FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../src/app/database'
import { databaseConnection, resetDatabaseConnection } from '../../src/app/database/database-connection'
import { setupServer } from '../../src/app/server'

const GLOBAL_KEY = '__TEST_ENV__'

function getGlobalState(): TestGlobalState | undefined {
    return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as TestGlobalState | undefined
}

function setGlobalState(state: TestGlobalState | undefined): void {
    (globalThis as Record<string, unknown>)[GLOBAL_KEY] = state
}

/**
 * Sets up the test environment. Reuses a shared DB/server singleton across test files.
 * Pass `{ fresh: true }` to force a new server — required for tests that use
 * vi.spyOn on server-internal modules, since the shared server captures module
 * references from the first evaluation.
 */
export async function setupTestEnvironment(opts?: { fresh?: boolean }): Promise<FastifyInstance> {
    if (opts?.fresh) {
        return createFreshEnvironment()
    }

    const existing = getGlobalState()
    if (existing) {
        await cleanDatabase()
        return existing.app
    }

    return createFreshEnvironment()
}

export async function teardownTestEnvironment(): Promise<void> {
    // No-op for shared mode; fresh mode destroys in next setupTestEnvironment call
}

async function createFreshEnvironment(): Promise<FastifyInstance> {
    const existing = getGlobalState()
    if (existing) {
        await databaseConnection().destroy()
    }
    resetDatabaseConnection()
    await initializeDatabase({ runMigrations: false })
    const app = await setupServer()
    setGlobalState({ app })
    return app
}

async function cleanDatabase(): Promise<void> {
    const ds = databaseConnection()
    const entities = ds.entityMetadatas
    const tableNames = entities.map(e => `"${e.tableName}"`).join(', ')
    if (tableNames.length > 0) {
        await ds.query(`TRUNCATE TABLE ${tableNames} CASCADE`)
    }
    const { databaseSeeds } = await import('../../src/app/database/seeds')
    await databaseSeeds.run()
}

type TestGlobalState = {
    app: FastifyInstance
}
