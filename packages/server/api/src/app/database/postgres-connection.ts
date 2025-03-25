import { TlsOptions } from 'node:tls'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { AddPgLocaleCollation1740031341436 } from './migration/postgres/1740031341436-add-pg-locale-collation'
import { InitialPg1740031656104 } from './migration/postgres/1740031656104-initial-pg'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { AddTables1741862762328 } from './migration/postgres/1741862762328-add-tables'
import { AddFlowTemplate1741587483735 } from './migration/postgres/1741587483735-add-flow-template'
import { AddOauthApp1741683756436 } from './migration/postgres/1741683756436-add-oauth-app'
import { AddGlobalOauthApp1741684926338 } from './migration/postgres/1741684926338-add-global-oauth-app'
import { InitialMsProjectConfig1742454177000 } from './migration/postgres/1742454177000-initial-ms-project-config'
import { AddDataColumnToFieldEntity1742395892304 } from './migration/postgres/1742395892304-AddDataColumnToFieldEntity'
import { AddTodosSquashed1742874382959 } from './migration/postgres/1742874382959-add-todos-squashed'

const getSslConfig = (): boolean | TlsOptions => {
    const useSsl = system.get(AppSystemProp.POSTGRES_USE_SSL)
    if (useSsl === 'true') {
        return {
            ca: system.get(AppSystemProp.POSTGRES_SSL_CA)?.replace(/\\n/g, '\n'),
        }
    }
    return false
}

const getMigrations = (): (new () => MigrationInterface)[] => {
    const commonMigration: (new () => MigrationInterface)[] = [
        AddTodosSquashed1742874382959,
        AddDataColumnToFieldEntity1742395892304,
        InitialMsProjectConfig1742454177000,
        AddTables1741862762328,
        AddGlobalOauthApp1741684926338,
        AddOauthApp1741683756436,
        AddFlowTemplate1741587483735,
        SwitchToRouter1741578250432,
        AddPgLocaleCollation1740031341436,
        InitialPg1740031656104,
    ]

    const edition = system.getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
        case ApEdition.ENTERPRISE:
            commonMigration.push()
            break
        case ApEdition.COMMUNITY:
            commonMigration.push()
            break
    }

    return commonMigration
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

export const createPostgresDataSource = (): DataSource => {
    const migrationConfig = getMigrationConfig()
    const url = system.get(AppSystemProp.POSTGRES_URL)

    if (!isNil(url)) {
        return new DataSource({
            type: 'postgres',
            url,
            ssl: getSslConfig(),
            ...migrationConfig,
            ...commonProperties,
        })
    }

    const database = system.getOrThrow(AppSystemProp.POSTGRES_DATABASE)
    const host = system.getOrThrow(AppSystemProp.POSTGRES_HOST)
    const password = system.getOrThrow(AppSystemProp.POSTGRES_PASSWORD)
    const serializedPort = system.getOrThrow(AppSystemProp.POSTGRES_PORT)
    const port = Number.parseInt(serializedPort, 10)
    const username = system.getOrThrow(AppSystemProp.POSTGRES_USERNAME)

    return new DataSource({
        type: 'postgres',
        host,
        port,
        username,
        password,
        database,
        ssl: getSslConfig(),
        ...migrationConfig,
        ...commonProperties,
    })
}

type MigrationConfig = {
    migrationsRun?: boolean
    migrationsTransactionMode?: 'all' | 'none' | 'each'
    migrations?: (new () => MigrationInterface)[]
}
