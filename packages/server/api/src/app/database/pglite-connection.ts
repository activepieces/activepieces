import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { DataSource } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { PGlite } from '@electric-sql/pglite'

const getPgliteDatabaseFilePath = (): string => {
    const apConfigDirectoryPath = system.getOrThrow(AppSystemProp.CONFIG_PATH)
    mkdirSync(apConfigDirectoryPath, { recursive: true })
    return path.resolve(path.join(apConfigDirectoryPath, 'pglite'))
}

const getPgliteDatabaseInMemory = (): string => {
    return 'memory://'
}

const getPgliteDatabase = (): string => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return getPgliteDatabaseInMemory()
    }
    return getPgliteDatabaseFilePath()
}

const getSynchronize = (): boolean => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    const value: Partial<Record<ApEnvironment, boolean>> = {
        [ApEnvironment.TESTING]: true,
    }

    return value[env] ?? false
}

// Custom connection wrapper for PGlite that mimics node-postgres interface
class PGliteConnection {
    private pglite: PGlite

    constructor(pglite: PGlite) {
        this.pglite = pglite
    }

    async query(queryText: string, values?: any[]): Promise<any> {
        const result = await this.pglite.query(queryText, values)
        return {
            rows: result.rows,
            rowCount: result.rows.length,
            fields: result.fields,
        }
    }

    async connect(): Promise<void> {
        // PGlite is always connected
    }

    async end(): Promise<void> {
        await this.pglite.close()
    }

    release(): void {
        // No-op for PGlite
    }
}

// Singleton PGlite instance
let pgliteInstance: PGlite | null = null

export const createPgliteDataSource = (): DataSource => {
    const dataPath = getPgliteDatabase()
    
    // Initialize PGlite instance if not already created
    if (!pgliteInstance) {
        pgliteInstance = new PGlite(dataPath)
    }

    // Create a custom driver factory for PGlite
    const driverFactory = () => {
        return new PGliteConnection(pgliteInstance!)
    }

    const dataSource = new DataSource({
        type: 'postgres', // PGlite is PostgreSQL-compatible
        // Use a dummy connection config as we'll override the driver
        host: 'pglite',
        database: 'pglite',
        driver: driverFactory as any,
        ...commonProperties,
        synchronize: getSynchronize(),
        // PGlite supports PostgreSQL migrations
        migrations: [],
        migrationsRun: false,
    })

    return dataSource
}
