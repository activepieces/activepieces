import os from 'os'
import path from 'path'
import fs from 'fs'
import { DataSource } from 'typeorm'
import { InitialSql3Migration1690195839899 } from './migration/sqllite3/1690195839899-InitialSql3Migration'
import { commonProperties } from './database-connection'
import { AddAppConnectionTypeToTopLevel1691706020626 } from './migration/sqllite3/1691706020626-add-app-connection-type-to-top-level'
import { AddTagsToRunSqlite31692056190942 } from './migration/sqllite3/1692056190942-AddTagsToRunSqlite3'
import { AddStepFileSqlite31692958076906 } from './migration/sqllite3/1692958076906-AddStepFileSqlite3'
import { AddImageUrlAndTitleToUser1693774053027 } from './migration/sqllite3/1693774053027-AddImageUrlAndTitleToUser'

function getSQLiteFilePath() {
    const homeDirectory = os.homedir()
    const hiddenFolderName = '.activepieces'
    const hiddenFolderPath = path.join(homeDirectory, hiddenFolderName)
    if (!fs.existsSync(hiddenFolderPath)) {
        fs.mkdirSync(hiddenFolderPath)
    }
    const sqliteFilePath = path.join(hiddenFolderPath, 'database.sqlite')
    return sqliteFilePath
}

export const createSqlLiteDatasource = () => {
    return new DataSource({
        type: 'sqlite',
        database: getSQLiteFilePath(),
        migrationsRun: true,
        migrationsTransactionMode: 'each',
        migrations: [
            InitialSql3Migration1690195839899,
            AddAppConnectionTypeToTopLevel1691706020626,
            AddTagsToRunSqlite31692056190942,
            AddStepFileSqlite31692958076906,
            AddImageUrlAndTitleToUser1693774053027,
        ],
        ...commonProperties,
    })
}
