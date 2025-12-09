import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { ApEnvironment } from '@activepieces/shared'
import { DataSource, EntityMetadata, MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { createSqlLiteDataSourceForMigrations } from '../../sqlite-connection'

const log = system.globalLogger()

export class MigrateSqliteToPglite1765308234291 implements MigrationInterface {
    name = 'MigrateSqliteToPglite1765308234291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const databaseType = system.get(AppSystemProp.DB_TYPE)
        const environment = system.get(AppSystemProp.ENVIRONMENT)

        if (databaseType !== DatabaseType.PGLITE || environment === ApEnvironment.TESTING) {
            log.info('[MigrateSqliteToPglite] Skipping - not PGLite or in testing mode')
            return
        }

        const hasData = await this.hasExistingData(queryRunner)
        if (hasData) {
            log.info('[MigrateSqliteToPglite] Skipping - PGLite already has data')
            return
        }


        log.info('[MigrateSqliteToPglite] Starting SQLite to PGLite data migration...')

        try {
            const sqliteDataSource = createSqlLiteDataSourceForMigrations()
            await sqliteDataSource.initialize()
            await sqliteDataSource.runMigrations()

            const sqliteHasData = await this.sqliteHasData(sqliteDataSource)
            if (!sqliteHasData) {
                log.info('[MigrateSqliteToPglite] SQLite database is empty, nothing to migrate')
                await sqliteDataSource.destroy()
                return
            }

            const entities = queryRunner.connection.entityMetadatas
            const sortedEntities = this.sortEntitiesByDependencies(entities)

            for (const entity of sortedEntities) {
                await this.copyTableData(sqliteDataSource, queryRunner, entity)
            }
            
            await sqliteDataSource.destroy()
            log.info('[MigrateSqliteToPglite] SQLite to PGLite migration completed successfully')
        }
        catch (error) {
            log.error({ error }, '[MigrateSqliteToPglite] Failed to migrate data from SQLite')
            throw error
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        log.info('[MigrateSqliteToPglite] Down migration - no action (data migration is one-way)')
    }

    private async hasExistingData(queryRunner: QueryRunner): Promise<boolean> {
        const result = await queryRunner.query('SELECT 1 FROM project LIMIT 1')
        return result.length > 0
        
    }

    private async sqliteHasData(sqliteDataSource: ReturnType<typeof createSqlLiteDataSourceForMigrations>): Promise<boolean> {
        try {
            const result = await sqliteDataSource.query('SELECT 1 FROM project LIMIT 1')
            return result.length > 0
        }
        catch {
            return false
        }
    }

    private sortEntitiesByDependencies(entities: EntityMetadata[]): EntityMetadata[] {
        const sorted: EntityMetadata[] = []
        const visited = new Set<string>()
        const visiting = new Set<string>()
        const entityMap = new Map<string, EntityMetadata>()

        for (const entity of entities) {
            entityMap.set(entity.tableName, entity)
        }

        const visit = (entity: EntityMetadata): void => {
            if (visited.has(entity.tableName)) {
                return
            }
            if (visiting.has(entity.tableName)) {
                return // Circular dependency, skip
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

    private async copyTableData(
        sqliteDataSource: DataSource,
        queryRunner: QueryRunner,
        entity: EntityMetadata,
    ): Promise<void> {
        const tableName = entity.tableName
        log.info(`[MigrateSqliteToPglite] Migrating table: ${tableName}`)

        let rows: Record<string, unknown>[] = []
        try {
            rows = await sqliteDataSource.query(`SELECT * FROM "${tableName}"`)
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('no such table')) {
                log.info(`[MigrateSqliteToPglite] Table ${tableName} does not exist in SQLite, skipping`)
                return
            }
            throw error
        }

        if (rows.length === 0) {
            log.info(`[MigrateSqliteToPglite] Table ${tableName} is empty, skipping`)
            return
        }

        log.info(`[MigrateSqliteToPglite] Copying ${rows.length} rows from ${tableName}`)

        const transformedRows = rows.map((row) => this.transformRowForPostgres(row, entity))

        // Disable foreign key checks for the migration
        await queryRunner.query('SET session_replication_role = replica')

        try {
            const BATCH_SIZE = 100
            const repository = queryRunner.connection.getRepository(entity.target)
            
            for (let i = 0; i < transformedRows.length; i += BATCH_SIZE) {
                const batch = transformedRows.slice(i, i + BATCH_SIZE)
                await repository.upsert(batch, { conflictPaths: ['id'] })
            }
        }
        finally {
            await queryRunner.query('SET session_replication_role = DEFAULT')
        }

        log.info(`[MigrateSqliteToPglite] Successfully migrated ${rows.length} rows to ${tableName}`)
    }

    private transformRowForPostgres(row: Record<string, unknown>, entity: EntityMetadata): Record<string, unknown> {
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
                    // Keep original value if parsing fails
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
}
