import os from 'os'
import path from 'path'
import fs from 'fs'
import { DataSource } from 'typeorm'
import { InitialSql3Migration1690195839899 } from './migration/sqllite3/1690195839899-InitialSql3Migration'
import { commonProperties } from './database-connection'
import { AddChatBotSqLite31691873711900 } from './migration/sqllite3/1691873711900-AddChatBotSqLite3'

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
            AddChatBotSqLite31691873711900,
        ],
        ...commonProperties,
    })
}
