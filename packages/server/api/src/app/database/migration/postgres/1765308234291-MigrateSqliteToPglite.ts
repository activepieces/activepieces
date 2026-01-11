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

        // Get SQLite column names for this table
        const sqliteColumns = await this.getSqliteColumnNames(sqliteDataSource, tableName)
        if (sqliteColumns.length === 0) {
            log.info(`[MigrateSqliteToPglite] Table ${tableName} does not exist in SQLite, skipping`)
            return
        }

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

        const transformedRows = rows.map((row) => this.transformRowForPostgres(row, entity, sqliteColumns))

        // Disable foreign key checks for the migration
        await queryRunner.query('SET LOCAL session_replication_role = replica')

        const BATCH_SIZE = 100
            
        for (let i = 0; i < transformedRows.length; i += BATCH_SIZE) {
            const batch = transformedRows.slice(i, i + BATCH_SIZE)
            await this.insertBatchRaw(queryRunner, tableName, batch, sqliteColumns, entity)
        }

        log.info(`[MigrateSqliteToPglite] Successfully migrated ${rows.length} rows to ${tableName}`)
    }

    private async getSqliteColumnNames(sqliteDataSource: DataSource, tableName: string): Promise<string[]> {
        try {
            const tableInfo = await sqliteDataSource.query(`PRAGMA table_info("${tableName}")`)
            return tableInfo.map((col: { name: string }) => col.name)
        }
        catch {
            return []
        }
    }

    private async insertBatchRaw(
        queryRunner: QueryRunner,
        tableName: string,
        batch: Record<string, unknown>[],
        sqliteColumns: string[],
        entity: EntityMetadata,
    ): Promise<void> {
        if (batch.length === 0) {
            return
        }

        const entityColumnMap = new Map(entity.columns.map((col) => [col.databaseName, col]))
        const columnNames = sqliteColumns.map((col) => `"${col}"`).join(', ')
        const updateColumns = sqliteColumns
            .filter((col) => col !== 'id')
            .map((col) => `"${col}" = EXCLUDED."${col}"`)
            .join(', ')

        const valuePlaceholders: string[] = []
        const parameters: unknown[] = []
        let paramIndex = 1

        for (const row of batch) {
            const rowPlaceholders: string[] = []
            for (const col of sqliteColumns) {
                const value = row[col]
                const columnMeta = entityColumnMap.get(col)
                const isArrayColumn = columnMeta?.isArray ?? false

                if (value === undefined || value === null) {
                    rowPlaceholders.push('NULL')
                }
                else if (isArrayColumn && Array.isArray(value)) {
                    // Convert JavaScript array to PostgreSQL array literal format
                    rowPlaceholders.push(`$${paramIndex}`)
                    parameters.push(this.toPostgresArrayLiteral(value))
                    paramIndex++
                }
                else if (typeof value === 'object' && value !== null) {
                    // JSON/JSONB columns
                    rowPlaceholders.push(`$${paramIndex}`)
                    parameters.push(JSON.stringify(value))
                    paramIndex++
                }
                else {
                    rowPlaceholders.push(`$${paramIndex}`)
                    parameters.push(value)
                    paramIndex++
                }
            }
            valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`)
        }

        const query = `
            INSERT INTO "${tableName}" (${columnNames})
            VALUES ${valuePlaceholders.join(', ')}
            ON CONFLICT ("id") DO UPDATE SET ${updateColumns}
        `

        await queryRunner.query(query, parameters)
    }

    private toPostgresArrayLiteral(arr: unknown[]): string {
        if (arr.length === 0) {
            return '{}'
        }
        const escaped = arr.map((item) => {
            if (item === null || item === undefined) {
                return 'NULL'
            }
            const str = String(item)
            // Escape backslashes and double quotes, then wrap in double quotes
            const escapedStr = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
            return `"${escapedStr}"`
        })
        return `{${escaped.join(',')}}`
    }

    private transformRowForPostgres(row: Record<string, unknown>, entity: EntityMetadata, sqliteColumns: string[]): Record<string, unknown> {
        const transformed: Record<string, unknown> = {}
        const sqliteColumnSet = new Set(sqliteColumns)
        const entityColumnMap = new Map(entity.columns.map((col) => [col.databaseName, col]))

        for (const columnName of sqliteColumns) {
            // Skip columns that don't exist in entity metadata
            const column = entityColumnMap.get(columnName)
            if (!column) {
                // Column exists in SQLite but not in entity - copy as-is
                transformed[columnName] = row[columnName]
                continue
            }

            // Skip columns that don't exist in SQLite
            if (!sqliteColumnSet.has(columnName)) {
                continue
            }

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

            transformed[columnName] = value
        }

        return transformed
    }
}
