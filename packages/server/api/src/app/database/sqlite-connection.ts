import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { ChangeExternalIdsForTables1747346473001 } from './migration/common/1747346473001-ChangeExternalIdsForTables'
import { UpgradePieceVersionsToLatest1748253670449 } from './migration/common/1748253670449-UpgradePieceVersionsToLatest'
import { DeprecateApproval1748648340742 } from './migration/common/1748648340742-DeprecateApproval'
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
import { RemoveFeatureFlagsFromSqlite1747824740845 } from './migration/sqlite/1747824740845-RemoveFeatureFlagsFromSqlite'
import { AddMcpToolEntitySQLITE1748365593414 } from './migration/sqlite/1748365593414-AddMcpToolEntitySQLITE'
import { AddMcpRunEntitySQLITE1748365786218 } from './migration/sqlite/1748365786218-AddMcpRunEntitySQLITE'
import { AddAgentsSqlite1748573768714 } from './migration/sqlite/1748573768714-AddAgentsSqlite'
import { AIProviderRefactorSqlite1748824241409 } from './migration/sqlite/1748824241409-AIProviderRefactorSqlite'
import { AddMcpToolFlowCascadeDeleteSqlite1749129178686 } from './migration/sqlite/1749129178686-AddMcpToolFlowCascadeDeleteSqlite'
import { RemoveDefaultLocaleFromPlatform1749735242946 } from './migration/sqlite/1749735242946-removeDefaultLocaleFromPlatform'
import { AddAgentsSqlite1749953500521 } from './migration/sqlite/1749953500521-AddAgentsSqlite'
import { AddFailedStepNameFlowRun1750045151951 } from './migration/sqlite/1750045151951-add-failed-step-flow-run'
import { AddIssueEntity1750058424539 } from './migration/sqlite/1750058424539-add-issue-entity'

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
        AddIssueEntity1750058424539,
        AddFailedStepNameFlowRun1750045151951,
        AddAgentsSqlite1748573768714,
        AddAgentsSqlite1749953500521,
        RemoveDefaultLocaleFromPlatform1749735242946,
        AIProviderRefactorSqlite1748824241409,
        AddMcpToolFlowCascadeDeleteSqlite1749129178686,
        AddMcpToolEntitySQLITE1748365593414,
        AddMcpRunEntitySQLITE1748365786218,
        DeprecateApproval1748648340742,
        UpgradePieceVersionsToLatest1748253670449,
        RemoveFeatureFlagsFromSqlite1747824740845,
        ChangeExternalIdsForTables1747346473001,
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
