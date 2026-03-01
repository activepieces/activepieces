import { FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../src/app/database'
import { databaseConnection, resetDatabaseConnection } from '../../src/app/database/database-connection'
import { setupServer } from '../../src/app/server'

export async function setupTestEnvironment(): Promise<FastifyInstance> {
    resetDatabaseConnection()
    await initializeDatabase({ runMigrations: false })
    return setupServer()
}

export async function teardownTestEnvironment(): Promise<void> {
    await databaseConnection().destroy()
    resetDatabaseConnection()
}
