import os from 'node:os'
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { DataSource, MigrationInterface } from 'typeorm'
import { InitialSql3Migration1690195839899 } from './migration/sqlite/1690195839899-InitialSql3Migration'
import { commonProperties } from './database-connection'
import { AddAppConnectionTypeToTopLevel1691706020626 } from './migration/sqlite/1691706020626-add-app-connection-type-to-top-level'
import { AddTagsToRunSqlite31692056190942 } from './migration/sqlite/1692056190942-AddTagsToRunSqlite3'
import { AddStepFileSqlite31692958076906 } from './migration/sqlite/1692958076906-AddStepFileSqlite3'
import { AddStatusToConnectionsSqlite31693402376520 } from './migration/sqlite/1693402376520-AddStatusToConnectionsSqlite3'
import { AddImageUrlAndTitleToUser1693774053027 } from './migration/sqlite/1693774053027-AddImageUrlAndTitleToUser'
import { FileTypeCompression1694695212159 } from './migration/sqlite/1694695212159-file-type-compression'
import { AddPieceTypeAndPackageTypeToFlowVersion1696245170061 } from './migration/common/1696245170061-add-piece-type-and-package-type-to-flow-version'
import { AddChatBotSqlite31696029443045 } from './migration/sqlite/1696029443045-AddChatBotSqlite3'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { getEdition } from '../helper/secret-helper'
import { AddPieceTypeAndPackageTypeToPieceMetadata1696016228398 } from './migration/sqlite/1696016228398-add-piece-type-and-package-type-to-piece-metadata'
import { Sql3MigrationCloud1690478550304 } from '../ee/database/migrations/sqlite3/1690478550304-Sql3MigrationCloud'
import { AddReferralsSqlLite31690547637542 } from '../ee/database/migrations/sqlite3/1690547637542-AddReferralsSqlLite3'
import { FlowTemplateAddUserIdAndImageUrl1694380048802 } from '../ee/database/migrations/sqlite3/1694380048802-flow-template-add-user-id-and-image-url'
import { AddArchiveIdToPieceMetadata1696956123632 } from './migration/sqlite/1696956123632-add-archive-id-to-piece-metadata'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { StoreCodeInsideFlow1697969398200 } from './migration/common/1697969398200-store-code-inside-flow'
import { AddPlatformToProject1698078715730 } from './migration/sqlite/1698078715730-add-platform-to-project'

const getSqliteDatabaseFilePath = (): string => {
    const homeDirectoryPath = os.homedir()
    const apConfigDirectoryName = '.activepieces'
    const apConfigDirectoryPath = path.join(homeDirectoryPath, apConfigDirectoryName)
    mkdirSync(apConfigDirectoryPath, { recursive: true })
    return path.join(apConfigDirectoryPath, 'database.sqlite')
}

const getSqliteDatabaseInMemory = (): string => {
    return ':memory:'
}

const getSqliteDatabase = (): string => {
    const env = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)

    if (env === ApEnvironment.TESTING) {
        return getSqliteDatabaseInMemory()
    }

    return getSqliteDatabaseFilePath()
}

const getMigrations = (): (new () => MigrationInterface)[] => {
    const commonMigration = [
        InitialSql3Migration1690195839899,
        AddAppConnectionTypeToTopLevel1691706020626,
        AddTagsToRunSqlite31692056190942,
        AddStepFileSqlite31692958076906,
        AddStatusToConnectionsSqlite31693402376520,
        AddImageUrlAndTitleToUser1693774053027,
        AddChatBotSqlite31696029443045,
        FileTypeCompression1694695212159,
        AddPieceTypeAndPackageTypeToPieceMetadata1696016228398,
        AddPieceTypeAndPackageTypeToFlowVersion1696245170061,
        AddArchiveIdToPieceMetadata1696956123632,
        StoreCodeInsideFlow1697969398200,
        AddPlatformToProject1698078715730,
    ]
    const edition = getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            commonMigration.push(
                Sql3MigrationCloud1690478550304,
                AddReferralsSqlLite31690547637542,
                FlowTemplateAddUserIdAndImageUrl1694380048802,
            )
            break
        case ApEdition.ENTERPRISE:
            break
        case ApEdition.COMMUNITY:
            break
    }
    return commonMigration
}

const getMigrationConfig = (): MigrationConfig => {
    const env = system.getOrThrow<ApEnvironment>(SystemProp.ENVIRONMENT)

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
