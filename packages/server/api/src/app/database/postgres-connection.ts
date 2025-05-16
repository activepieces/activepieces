import { TlsOptions } from 'node:tls'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, isNil } from '@activepieces/shared'
import { DataSource, MigrationInterface } from 'typeorm'
import { system } from '../helper/system/system'
import { commonProperties } from './database-connection'
import { SwitchToRouter1741578250432 } from './migration/common/1741578250432-switch-to-router'
import { ChangeExternalIdsForTables1747346473000 } from './migration/common/1747346473000-ChangeExternalIdsForTables'
import { AddPgLocaleCollation1740031341436 } from './migration/postgres/1740031341436-add-pg-locale-collation'
import { InitialPg1740031656104 } from './migration/postgres/1740031656104-initial-pg'
import { AddFlowTemplate1741587483735 } from './migration/postgres/1741587483735-add-flow-template'
import { AddOauthApp1741683756436 } from './migration/postgres/1741683756436-add-oauth-app'
import { AddGlobalOauthApp1741684926338 } from './migration/postgres/1741684926338-add-global-oauth-app'
import { AddTables1741862762328 } from './migration/postgres/1741862762328-add-tables'
import { AddDataColumnToFieldEntity1742395892304 } from './migration/postgres/1742395892304-AddDataColumnToFieldEntity'
import { AddTodosSquashed1742874382959 } from './migration/postgres/1742874382959-add-todos-squashed'
import { RenameApprovalUrlToResolveUrl1742991137557 } from './migration/postgres/1742991137557-RenameApprovalUrlToResolveUrl'
import { AddMCP1743128816786 } from './migration/postgres/1743128816786-AddMCP'
import { AddMetadataFields1743780156664 } from './migration/postgres/1743780156664-AddMetadataFields'
import { AddLastChangelogDismissed1744053592923 } from './migration/postgres/1744053592923-AddLastChangelogDismissed'
import { AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994 } from './migration/postgres/1744187975994-AddRecordIndexForTableIdAndProjectIdAndRecordId'
import { AddMcpPiece1744822233873 } from './migration/postgres/1744822233873-AddMcpPiece'
import { AddMetadataFlowTemplate1744898816545 } from './migration/postgres/1744898816545-add-metadata-flow-template'
import { RenameTodoPostiveVariantName1745272231418 } from './migration/postgres/1745272231418-RenameTodoPostiveVariantName'
import { AddConnectionIdsToFlowVersion1745530653784 } from './migration/postgres/1745530653784-AddConnectionIdsToFlowVersion'
import { AddExternalIdForTablesAndFields1746356907629 } from './migration/postgres/1746356907629-AddExternalIdForTablesAndFields'
import { MakeExternalIdNotNullable1746531094548 } from './migration/postgres/1746531094548-MakeExternalIdNotNullable'
import { ChangeMcpPieceForeignKey1746543299109 } from './migration/postgres/1746543299109-ChangeMcpPieceForeignKey'
import { AddI18nColumnToPieceMetadata1746714836833 } from './migration/postgres/1746714836833-AddI18nColumnToPieceMetadata'
import { AddHandshakeConfigurationToFlow1746848208563 } from './migration/postgres/1746848208563-AddHandshakeConfigurationToFlow'
import { AddOrderToFolder1747095861746 } from './migration/postgres/1747095861746-AddOrderToFolder'

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
        ChangeExternalIdsForTables1747346473000,
        AddI18nColumnToPieceMetadata1746714836833,
        AddOrderToFolder1747095861746,
        AddHandshakeConfigurationToFlow1746848208563,
        ChangeMcpPieceForeignKey1746543299109,
        MakeExternalIdNotNullable1746531094548,
        AddExternalIdForTablesAndFields1746356907629,
        AddConnectionIdsToFlowVersion1745530653784,
        RenameTodoPostiveVariantName1745272231418,
        AddMcpPiece1744822233873,
        AddMetadataFlowTemplate1744898816545,
        AddLastChangelogDismissed1744053592923,
        AddMetadataFields1743780156664,
        AddRecordIndexForTableIdAndProjectIdAndRecordId1744187975994,
        AddMCP1743128816786,
        RenameApprovalUrlToResolveUrl1742991137557,
        AddTodosSquashed1742874382959,
        AddDataColumnToFieldEntity1742395892304,
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
