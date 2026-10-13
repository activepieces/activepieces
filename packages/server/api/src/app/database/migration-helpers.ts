import { FastifyBaseLogger } from 'fastify'
import { QueryRunner } from 'typeorm'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { BackgroundMigration } from './background-migration'
import { BACKGROUND_MIGRATION_LOCK_TIMEOUT_SECONDS, BACKGROUND_MIGRATIONS_TABLE, backgroundMigrationLockKey } from './background-migration-runner'
import { DatabaseType } from './database-type'
import { distributedLock } from './redis-connections'

export const migrationHelpers = {
    createIndexConcurrently,
    dropIndexConcurrently,
    requireBackgroundMigrationComplete,
}

async function requireBackgroundMigrationComplete<T>({
    queryRunner,
    log,
    migration,
    fn,
}: {
    queryRunner: QueryRunner
    log: FastifyBaseLogger
    migration: new () => BackgroundMigration
    fn: () => Promise<T>
}): Promise<T> {
    const name = new migration().name
    return distributedLock(log).runExclusive({
        key: backgroundMigrationLockKey(name),
        timeoutInSeconds: BACKGROUND_MIGRATION_LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const rows = await queryRunner.query(
                `SELECT 1 FROM "${BACKGROUND_MIGRATIONS_TABLE}" WHERE "name" = $1 AND "executed_at" IS NOT NULL`,
                [name],
            )
            if (rows.length === 0) {
                throw new BackgroundMigrationNotCompleteError(migration)
            }
            return fn()
        },
    })
}

async function createIndexConcurrently({
    queryRunner,
    name,
    table,
    columns,
    where,
    unique = false,
}: {
    queryRunner: QueryRunner
    name: string
    table: string
    columns: string
    where?: string
    unique?: boolean
}): Promise<void> {
    const uniqueClause = unique ? 'UNIQUE ' : ''
    const whereClause = where ? ` WHERE ${where}` : ''

    if (isPGlite()) {
        await queryRunner.query(
            `CREATE ${uniqueClause}INDEX IF NOT EXISTS "${name}" ON "${table}" (${columns})${whereClause}`,
        )
        return
    }

    const rows = await queryRunner.query(
        `SELECT indisvalid FROM pg_index i
         JOIN pg_class c ON c.oid = i.indexrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE c.relname = $1 AND n.nspname = current_schema()`,
        [name],
    )
    const indisvalid = extractIndisvalid(rows)

    if (indisvalid === true) return

    if (indisvalid === false) {
        await queryRunner.query(`REINDEX INDEX CONCURRENTLY "${name}"`)
        return
    }

    await queryRunner.query(
        `CREATE ${uniqueClause}INDEX CONCURRENTLY "${name}" ON "${table}" (${columns})${whereClause}`,
    )
}

async function dropIndexConcurrently({
    queryRunner,
    name,
}: {
    queryRunner: QueryRunner
    name: string
}): Promise<void> {
    const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
    await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "${name}"`)
}


const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

function extractIndisvalid(rows: unknown): boolean | undefined {
    if (!Array.isArray(rows) || rows.length === 0) return undefined
    const [row] = rows
    if (row === null || typeof row !== 'object' || !('indisvalid' in row)) return undefined
    const value = row.indisvalid
    if (typeof value !== 'boolean') return undefined
    return value
}

export class BackgroundMigrationNotCompleteError extends Error {
    constructor(public readonly migration: new () => BackgroundMigration) {
        const name = new migration().name
        super(`Background migration "${name}" has not completed. See background_migrations.last_error for details.`)
        this.name = 'BackgroundMigrationNotCompleteError'
    }
}
