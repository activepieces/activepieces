import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { DataSource, MigrationInterface } from 'typeorm'
import { InitialSql3Migration1690195839899 } from './migration/sqlite/1690195839899-InitialSql3Migration'
import { commonProperties } from './database-connection'
import { AddAppConnectionTypeToTopLevel1691706020626 } from './migration/sqlite/1691706020626-add-app-connection-type-to-top-level'
import { AddImageUrlAndTitleToUser1693774053027 } from './migration/sqlite/1693774053027-AddImageUrlAndTitleToUser'
import { FileTypeCompression1694695212159 } from './migration/sqlite/1694695212159-file-type-compression'
import { AddPieceTypeAndPackageTypeToFlowVersion1696245170061 } from './migration/common/1696245170061-add-piece-type-and-package-type-to-flow-version'
import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { getEdition } from '../helper/secret-helper'
import { AddPieceTypeAndPackageTypeToPieceMetadata1696016228398 } from './migration/sqlite/1696016228398-add-piece-type-and-package-type-to-piece-metadata'
import { AddArchiveIdToPieceMetadata1696956123632 } from './migration/sqlite/1696956123632-add-archive-id-to-piece-metadata'
import { system, SystemProp } from 'server-shared'
import { StoreCodeInsideFlow1697969398200 } from './migration/common/1697969398200-store-code-inside-flow'
import { AddPlatformToProject1698078715730 } from './migration/sqlite/1698078715730-add-platform-to-project'
import { AddExternalIdSqlite1698857968495 } from './migration/sqlite/1698857968495-AddExternalIdSqlite'
import { UpdateUserStatusRenameShadowToInvited1699818680567 } from './migration/common/1699818680567-update-user-status-rename-shadow-to-invited'
import { AddChatBotSqlite1696029443045 } from './migration/sqlite/1696029443045-AddChatBotSqlite'
import { AddStepFileSqlite1692958076906 } from './migration/sqlite/1692958076906-AddStepFileSqlite'
import { AddTagsToRunSqlite1692056190942 } from './migration/sqlite/1692056190942-AddTagsToRunSqlite'
import { AddStatusToConnectionsSqlite1693402376520 } from './migration/sqlite/1693402376520-AddStatusToConnectionsSqlite'
import { AddPlatformIdToUserSqlite1700147448410 } from './migration/sqlite/1700147448410-AddPlatformIdToUserSqlite'
import { AddTerminationReasonSqlite1698323327318 } from './migration/sqlite/1698323327318-AddTerminationReason'
import { AddPlatformIdToPieceMetadataSqlite1700524446967 } from './migration/sqlite/1700524446967-AddPlatformIdToPieceMetadataSqlite'
import { AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822 } from './migration/common/1701096458822-add-partial-unique-index-for-email-and-platform-id-is-null'
import { AddPlatformIdToFileSqlite1701808264444 } from './migration/sqlite/1701808264444-AddPlatformIdToFileSqlite'
import { RemoveFlowInstanceSqlite1702412280963 } from './migration/sqlite/1702412280963-remove-flow-instance-sqlite'
import { UpdateStatusInUserSqlite1703713027818 } from './migration/sqlite/1703713027818-UpdateStatusInUserSqlite'
import { RenameAppNameToPieceNameSqlite1703713475755 } from './migration/sqlite/1703713475755-RenameAppNameToPieceNameSqlite'
import { AddVerifiedAndChangeStatusSqlite1703768553820 } from './migration/sqlite/1703768553820-AddVerifiedAndChangeStatusSqlite'
import { AddTriggerTestStrategy1707087022764 } from './migration/common/1707087022764-add-trigger-test-strategy'
import { AddCategoriesToPieceMetadata1707229986819 } from './migration/sqlite/1707229986819-AddCategoriesToPieceMetadata'
import { AddUniqueStoreConstraint1708527446535 } from './migration/sqlite/1708527446535-AddUniqueStoreConstraint'
import { CreateDefaultPlaformSqlite1709051625110 } from './migration/sqlite/1709051625110-CreateDefaultPlaformSqlite'
import { MigrateWebhook1709581196563 } from './migration/common/1709581196563-migrate-webhook'
import { AddPlatformForeignKeyToProjectSqlite1709566629593 } from './migration/sqlite/1709566629593-add-platform-foreign-key-to-project-sqlite'
import { AddAuthorsToPieces1710098009544 } from './migration/sqlite/1710098009544-AddAuthorsToPieces'


const getSqliteDatabaseFilePath = (): string => {
    const apConfigDirectoryPath = system.getOrThrow(SystemProp.CONFIG_PATH)
    mkdirSync(apConfigDirectoryPath, { recursive: true })
    return path.resolve(path.join(apConfigDirectoryPath, 'database.sqlite'))
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
    const communityMigrations = [
        InitialSql3Migration1690195839899,
        AddAppConnectionTypeToTopLevel1691706020626,
        AddTagsToRunSqlite1692056190942,
        AddStepFileSqlite1692958076906,
        AddStatusToConnectionsSqlite1693402376520,
        AddImageUrlAndTitleToUser1693774053027,
        AddChatBotSqlite1696029443045,
        FileTypeCompression1694695212159,
        AddPieceTypeAndPackageTypeToPieceMetadata1696016228398,
        AddPieceTypeAndPackageTypeToFlowVersion1696245170061,
        AddArchiveIdToPieceMetadata1696956123632,
        StoreCodeInsideFlow1697969398200,
        AddPlatformToProject1698078715730,
        AddTerminationReasonSqlite1698323327318,
        AddExternalIdSqlite1698857968495,
        UpdateUserStatusRenameShadowToInvited1699818680567,
        AddPlatformIdToUserSqlite1700147448410,
        AddPlatformIdToPieceMetadataSqlite1700524446967,
        AddPartialUniqueIndexForEmailAndPlatformIdIsNull1701096458822,
        AddPlatformIdToFileSqlite1701808264444,
        RemoveFlowInstanceSqlite1702412280963,
        UpdateStatusInUserSqlite1703713027818,
        RenameAppNameToPieceNameSqlite1703713475755,
        AddVerifiedAndChangeStatusSqlite1703768553820,
        AddTriggerTestStrategy1707087022764,
        AddCategoriesToPieceMetadata1707229986819,
        AddUniqueStoreConstraint1708527446535,
        CreateDefaultPlaformSqlite1709051625110,
        MigrateWebhook1709581196563,
        AddPlatformForeignKeyToProjectSqlite1709566629593,
        AddAuthorsToPieces1710098009544,
    ]
    const edition = getEdition()
    if (edition !== ApEdition.COMMUNITY) {
        throw new Error(`Edition ${edition} not supported in sqlite3 mode`)
    }
    return communityMigrations
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
