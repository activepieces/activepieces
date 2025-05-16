import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { ChangeExternalIdsForTables1747346473000 } from './migration/common/1747346473000-ChangeExternalIdsForTables'
import { InitialSqlite1740031972943 } from './migration/sqlite/1740031972943-initial-sqlite'
import { AddFlowTemplate1741588702453 } from './migration/sqlite/1741588702453-add-flow-template'
import { AddOauthApp1741683781609 } from './migration/sqlite/1741683781609-add-oauth-app'
import { AddGlobalOauthApp1741685103864 } from './migration/sqlite/1741685103864-add-global-oauth-app'
import { AddTables1741862813806 } from './migration/sqlite/1741862813806-add-tables'
import { AddDataColumnToFieldEntity1742390870702 } from './migration/sqlite/1742390870702-AddDataColumnToFieldEntity'
import { AddTodosSquashed1742874467240 } from './migration/sqlite/1742874467240-add-todos-squashed'
import { RenameApprovalUrlToResolveUrl1742991301509 } from './migration/sqlite/1742991301509-RenameApprovalUrlToResolveUrl'
import { AddMCPSqlite1743127177235 } from './migration/sqlite/1743127177235-AddMCPSqlite'
import { AddMetadataFields1743780156664 } from './migration/sqlite/1743780156664-AddMetadataFields'
import { AddLastChangelogDismissedSQLITE1744053922591 } from './migration/sqlite/1744053922591-AddLastChangelogDismissedSQLITE'
import { AddRecordIndexForTableIdAndProjectIdAndRecordId1744104496262 } from './migration/sqlite/1744104496262-AddRecordIndexForTableIdAndProjectIdAndRecordId'
import { AddMcpPieceSqlite1744822233873 } from './migration/sqlite/1744822233873-AddMcpPieceSqlite'
import { AddMetadataFlowTemplate1744898945629 } from './migration/sqlite/1744898945629-add-metadata-flow-template'
import { RenameTodoVariantName1745269828603 } from './migration/sqlite/1745269828603-RenameTodoVariantName'
import { AddConnectionIdsToFlowVersion1745531870426 } from './migration/sqlite/1745531870426-AddConnectionIdsToFlowVersion'
import { AddExternalIdForTablesAndFieldsSQLITE1746367601605 } from './migration/sqlite/1746367601605-AddExternalIdForTablesAndFieldsSQLITE'
import { MakeExternalIdNotNullableSqlite1746529105649 } from './migration/sqlite/1746529105649-MakeExternalIdNotNullableSqlite'
import { ChangeMcpPieceForeignKey1746543346220 } from './migration/sqlite/1746543346220-ChangeMcpPieceForeignKey'
import { AddI18nColumnToPieceMetadata1746714949131 } from './migration/sqlite/1746714949131-AddI18nColumnToPieceMetadata'
import { AddHandshakeConfigurationToFlowSqlite1746845932780 } from './migration/sqlite/1746845932780-AddHandshakeConfigurationToFlowSqlite'
import { AddFolderDisplayOrder1747062679388 } from './migration/sqlite/1747062679388-AddFolderDisplayOrder'
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
        ChangeExternalIdsForTables1747346473000,
        AddI18nColumnToPieceMetadata1746714949131,
        AddFolderDisplayOrder1747062679388,
        AddHandshakeConfigurationToFlowSqlite1746845932780,
        ChangeMcpPieceForeignKey1746543346220,
        MakeExternalIdNotNullableSqlite1746529105649,
        AddExternalIdForTablesAndFieldsSQLITE1746367601605,
        AddConnectionIdsToFlowVersion1745531870426,
        RenameTodoVariantName1745269828603,
        AddMcpPieceSqlite1744822233873,
        AddMetadataFlowTemplate1744898945629,
        AddLastChangelogDismissedSQLITE1744053922591,
        AddMetadataFields1743780156664,
        AddRecordIndexForTableIdAndProjectIdAndRecordId1744104496262,
        AddMCPSqlite1743127177235,
        RenameApprovalUrlToResolveUrl1742991301509,
        AddTodosSquashed1742874467240,
        AddDataColumnToFieldEntity1742390870702,
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
