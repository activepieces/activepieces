import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, spreadIfDefined } from '@activepieces/shared'
import { types } from '@electric-sql/pglite'
import { DataSource } from 'typeorm'
import { PGliteDriver } from 'typeorm-pglite'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { getMigrations } from './postgres-connection'

const getPGliteDataPathFromDisk = (): string => {
    const apConfigDirectoryPath = system.getOrThrow(AppSystemProp.CONFIG_PATH)
    const pgliteDataPath = path.resolve(path.join(apConfigDirectoryPath, 'pglite'))
    mkdirSync(pgliteDataPath, { recursive: true })
    return pgliteDataPath
}

const getPGliteDataPath = (): string | undefined => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return undefined // In-memory mode
    }
    return getPGliteDataPathFromDisk()
}

export const createPGliteDataSource = (): DataSource => {
    const edition = system.getEdition()
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)
    if (edition !== ApEdition.COMMUNITY && env !== ApEnvironment.TESTING) {
        throw new Error(`Edition ${edition} not supported in pglite mode in ${env} environment`)
    }

    const dataPath = getPGliteDataPath()

    return new DataSource({
        type: 'postgres',
        driver: new PGliteDriver({
            ...spreadIfDefined('dataDir', dataPath),
            serializers: {
                [types.BOOL]: (val: unknown): string => {
                    if (val === true || val === 'true' || val === 1) return 'TRUE'
                    if (val === false || val === 'false' || val === 0) return 'FALSE'
                    return String(val)
                },

            },
            parsers: {
                [types.BYTEA]: (val: unknown): Buffer => {
                    if (val instanceof Buffer) {
                        return val
                    }
                    if (typeof val === 'string') {
                        if (val.startsWith('\\x')) {
                            return Buffer.from(val.slice(2), 'hex')
                        }
                        return Buffer.from(val)
                    }
                    if (val && typeof val === 'object' && 'length' in val) {
                        return Buffer.from(val as Uint8Array)
                    }
                    throw new Error(`Unexpected bytea value type: ${typeof val}`)
                },
            },
        }).driver,
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: getMigrations(),
        synchronize: false,
        ...commonProperties,
    })
}

