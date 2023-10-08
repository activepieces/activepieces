import os from 'os'
import path from 'path'
import fs from 'fs'
import { DataSource } from 'typeorm'
import { InitialSql3Migration1690195839899 } from './migration/sqllite3/1690195839899-InitialSql3Migration'
import { commonProperties } from './database-connection'
import { AddAppConnectionTypeToTopLevel1691706020626 } from './migration/sqllite3/1691706020626-add-app-connection-type-to-top-level'
import { AddTagsToRunSqlite31692056190942 } from './migration/sqllite3/1692056190942-AddTagsToRunSqlite3'
import { AddStepFileSqlite31692958076906 } from './migration/sqllite3/1692958076906-AddStepFileSqlite3'
import { AddStatusToConnectionsSqlite31693402376520 } from './migration/sqllite3/1693402376520-AddStatusToConnectionsSqlite3'
import { AddImageUrlAndTitleToUser1693774053027 } from './migration/sqllite3/1693774053027-AddImageUrlAndTitleToUser'
import { FileTypeCompression1694695212159 } from './migration/sqllite3/1694695212159-file-type-compression'
import { AddPieceTypeAndPackageTypeToFlowVersion1696245170061 } from './migration/common/1696245170061-add-piece-type-and-package-type-to-flow-version'
import { AddChatBotSqlite31696029443045 } from './migration/sqllite3/1696029443045-AddChatBotSqlite3'
import { ApEdition } from '@activepieces/shared'
import { getEdition } from '../helper/secret-helper'

import { AddPieceTypeAndPackageTypeToPieceMetadata1696016228398 } from './migration/sqllite3/1696016228398-add-piece-type-and-package-type-to-piece-metadata'
import { Sql3MigrationCloud1690478550304 } from '../ee/database/migrations/sqlite3/1690478550304-Sql3MigrationCloud'
import { AddReferralsSqlLite31690547637542 } from '../ee/database/migrations/sqlite3/1690547637542-AddReferralsSqlLite3'
import { FlowTemplateAddUserIdAndImageUrl1694380048802 } from '../ee/database/migrations/sqlite3/1694380048802-flow-template-add-user-id-and-image-url'

function getSQLiteFilePath(): string {
    const homeDirectory = os.homedir()
    const hiddenFolderName = '.activepieces'
    const hiddenFolderPath = path.join(homeDirectory, hiddenFolderName)
    if (!fs.existsSync(hiddenFolderPath)) {
        fs.mkdirSync(hiddenFolderPath)
    }
    const sqliteFilePath = path.join(hiddenFolderPath, 'database.sqlite')
    return sqliteFilePath
}
const getMigration = () => {
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
    ]
    const edition = getEdition()
    switch (edition) {
        case ApEdition.CLOUD:
            commonMigration.push(Sql3MigrationCloud1690478550304)
            commonMigration.push(AddReferralsSqlLite31690547637542)
            commonMigration.push(FlowTemplateAddUserIdAndImageUrl1694380048802)
            break
        case ApEdition.ENTERPRISE:
            break
        case ApEdition.COMMUNITY:
            break
    }
    return commonMigration
}

export const createSqlLiteDatasource = (): DataSource => {
    return new DataSource({
        type: 'sqlite',
        database: getSQLiteFilePath(),
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: getMigration(),
        ...commonProperties,
    })
}
