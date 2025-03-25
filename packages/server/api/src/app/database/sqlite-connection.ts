import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { InitialSqlite1740031972943 } from './migration/sqlite/1740031972943-initial-sqlite'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { AddTables1741862813806 } from './migration/sqlite/1741862813806-add-tables'
import { AddFlowTemplate1741588702453 } from './migration/sqlite/1741588702453-add-flow-template'
import { AddOauthApp1741683781609 } from './migration/sqlite/1741683781609-add-oauth-app'
import { AddGlobalOauthApp1741685103864 } from './migration/sqlite/1741685103864-add-global-oauth-app'
import { InitialMsProjectConfig1742454177000 } from './migration/sqlite/1742454177000-initial-ms-project-config'
import { AddDataColumnToFieldEntity1742390870702 } from './migration/sqlite/1742390870702-AddDataColumnToFieldEntity'
import { AddTodosSquashed1742874467240 } from './migration/sqlite/1742874467240-add-todos-squashed'

const getSqliteDatabaseFilePath = (): string => {
    const apConfigDirectoryPath = system.getOrThrow(AppSystemProp.CONFIG_PATH)
    mkdirSync(apConfigDirectoryPath, { recursive: true })
    return path.resolve(path.join(apConfigDirectoryPath, 'database.sqlite'))
}

const getSqliteDatabaseInMemory = (): string => {
    return ':memory:'
}

const getSqliteDatabase = (): string => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return getSqliteDatabaseInMemory()
    }
    return getSqliteDatabaseFilePath()
}

const getMigrations = (): (new () => MigrationInterface)[] => {
    const communityMigrations: (new () => MigrationInterface)[] = [
        AddTodosSquashed1742874467240,
        AddDataColumnToFieldEntity1742390870702,
        InitialMsProjectConfig1742454177000,
        AddTables1741862813806,
        AddGlobalOauthApp1741685103864,
        AddOauthApp1741683781609,
        AddFlowTemplate1741588702453,
        SwitchToRouter1741578250432,
        InitialSqlite1740031972943,
    ]

    const edition = system.getEdition()
    if (edition !== ApEdition.COMMUNITY) {
        throw new Error(`Edition ${edition} not supported in sqlite3 mode`)
    }
    return communityMigrations
}

const getMigrationConfig = (): MigrationConfig => {
    const env = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return {}
    }

    return {
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: getMigrations(),
    }
}

export const createSqlLiteDataSource = (): DataSource => {
    const migrationConfig = getMigrationConfig()

    return new DataSource({
        type: 'sqlite',
        database: getSqliteDatabase(),
        ...migrationConfig,
        ...commonProperties,
    })
}

type MigrationConfig = {
    migrationsRun?: boolean
    migrationsTransactionMode?: 'all' | 'none' | 'each'
    migrations?: (new () => MigrationInterface)[]
}
