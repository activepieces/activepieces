import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'
import { types } from '@electric-sql/pglite'
import { DataSource } from 'typeorm'
import { PGliteDriver } from 'typeorm-pglite'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { getMigrations } from './postgres-connection'

const getPGliteDataPath = (): string => {
    const apConfigDirectoryPath = system.getOrThrow(AppSystemProp.CONFIG_PATH)
    const pgliteDataPath = path.resolve(path.join(apConfigDirectoryPath, 'pglite'))
    mkdirSync(pgliteDataPath, { recursive: true })
    return pgliteDataPath
}

export const createPGliteDataSource = (): DataSource => {
    const edition = system.getEdition()
    if (edition !== ApEdition.COMMUNITY) {
        throw new Error(`Edition ${edition} not supported in pglite mode`)
    }

    const dataPath = getPGliteDataPath()

    return new DataSource({
        type: 'postgres',
        driver: new PGliteDriver({
            dataDir: dataPath,
            serializers: {
                [types.BOOL]: (val: unknown): string => {
                    if (val === true || val === 'true' || val === 1) return 'TRUE'
                    if (val === false || val === 'false' || val === 0) return 'FALSE'
                    return String(val)
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

