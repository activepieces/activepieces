import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { DataSource, EntityMetadata } from 'typeorm'
import { DatabaseType, system } from '../../helper/system/system'
import { createPGliteDataSource } from '../pglite-connection'
import { createSqlLiteDataSourceForMigrations } from '../sqlite-connection'

const log = system.globalLogger()

async function isPGliteEmpty(pgliteDataSource: DataSource): Promise<boolean> {
    const result = await pgliteDataSource.query('SELECT 1 FROM project LIMIT 1')
    return result.length === 0
}

export async function shouldMigrateSqliteToPGlite(): Promise<boolean> {
    if (system.get(AppSystemProp.DB_TYPE) !== DatabaseType.PGLITE || system.get(AppSystemProp.ENVIRONMENT) === ApEnvironment.TESTING) {
        return false
    }

    const pgliteDataSource = createPGliteDataSource()
    await pgliteDataSource.initialize()
    
    try {
        const isEmpty = await isPGliteEmpty(pgliteDataSource)
        return isEmpty
    }
    finally {
        await pgliteDataSource.destroy()
    }
}

export async function migrateSqliteToPGlite(): Promise<void> {
    log.info('Starting SQLite to PGLite migration...')

    const sqliteDataSource = createSqlLiteDataSourceForMigrations()
    await sqliteDataSource.initialize()
    await sqliteDataSource.runMigrations()

    const pgliteDataSource = createPGliteDataSource()
    await pgliteDataSource.initialize()
    await pgliteDataSource.runMigrations()

    try {
        await copyAllTables(sqliteDataSource, pgliteDataSource)
        log.info('SQLite to PGLite migration completed successfully')
    }
    finally {
        await sqliteDataSource.destroy()
        await pgliteDataSource.destroy()
    }
}

async function copyAllTables(sqliteDataSource: DataSource, pgliteDataSource: DataSource): Promise<void> {
    const entities = pgliteDataSource.entityMetadatas

    const sortedEntities = sortEntitiesByDependencies(entities)

    for (const entity of sortedEntities) {
        await copyTableData(sqliteDataSource, pgliteDataSource, entity)
    }
}

function sortEntitiesByDependencies(entities: EntityMetadata[]): EntityMetadata[] {
    const sorted: EntityMetadata[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const entityMap = new Map<string, EntityMetadata>()

    for (const entity of entities) {
        entityMap.set(entity.tableName, entity)
    }

    function visit(entity: EntityMetadata): void {
        if (visited.has(entity.tableName)) {
            return
        }
        if (visiting.has(entity.tableName)) {
            return
        }

        visiting.add(entity.tableName)

        for (const foreignKey of entity.foreignKeys) {
            const referencedTable = foreignKey.referencedTablePath
            const referencedEntity = entityMap.get(referencedTable)
            if (referencedEntity && referencedEntity.tableName !== entity.tableName) {
                visit(referencedEntity)
            }
        }

        visiting.delete(entity.tableName)
        visited.add(entity.tableName)
        sorted.push(entity)
    }

    for (const entity of entities) {
        visit(entity)
    }

    return sorted
}

const BATCH_SIZE = 100

async function copyTableData(
    sqliteDataSource: DataSource,
    pgliteDataSource: DataSource,
    entity: EntityMetadata,
): Promise<void> {
    const tableName = entity.tableName
    log.info(`Migrating table: ${tableName}`)

    let rows: Record<string, unknown>[] = []
    try {
        rows = await sqliteDataSource.query(`SELECT * FROM "${tableName}"`)
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('no such table')) {
            log.info(`Table ${tableName} does not exist, skipping`)
            return
        }
        throw error
    }

    if (rows.length === 0) {
        log.info(`Table ${tableName} is empty, skipping`)
        return
    }

    log.info(`Copying ${rows.length} rows from ${tableName}`)

    const transformedRows = rows.map((row) => transformRowForPostgres(row, entity))

    const queryRunner = pgliteDataSource.createQueryRunner()
    await queryRunner.connect()

    try {
        await queryRunner.startTransaction()

        // Disable foreign key checks for the migration
        await queryRunner.query('SET session_replication_role = replica')

        const repository = pgliteDataSource.getRepository(entity.target)
        for (let i = 0; i < transformedRows.length; i += BATCH_SIZE) {
            const batch = transformedRows.slice(i, i + BATCH_SIZE)
            await repository.upsert(batch, { conflictPaths: ['id'] })
        }

        await queryRunner.query('SET session_replication_role = DEFAULT')

        await queryRunner.commitTransaction()
        log.info(`Successfully migrated ${rows.length} rows to ${tableName}`)
    }
    catch (error) {
        await queryRunner.rollbackTransaction()
        log.error({ error }, `Failed to migrate table ${tableName}`)
        throw error
    }
    finally {
        await queryRunner.release()
    }
}

function transformRowForPostgres(row: Record<string, unknown>, entity: EntityMetadata): Record<string, unknown> {
    const transformed: Record<string, unknown> = {}

    for (const column of entity.columns) {
        const columnName = column.databaseName
        const propertyName = column.propertyName
        let value = row[columnName]

        if (value === undefined) {
            continue
        }

        if ((column.type === 'json' || column.type === 'jsonb') && typeof value === 'string') {
            try {
                value = JSON.parse(value)
            }
            catch {
                continue
            }
        }

        if (column.isArray && typeof value === 'string') {
            value = value === '' ? [] : value.split(',')
        }

        if (column.type === Boolean || column.type === 'boolean') {
            value = value === 1 || value === '1' || value === true
        }

        transformed[propertyName] = value
    }

    return transformed
}
