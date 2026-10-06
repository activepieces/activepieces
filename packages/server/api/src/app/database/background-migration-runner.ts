import { tryCatch } from '@activepieces/core-utils'
import { wideEvent } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { DataSource } from 'typeorm'
import { BackgroundMigration } from './background-migration'
import { databaseConnection } from './database-connection'
import { getBackgroundMigrations } from './postgres-connection'

export const backgroundMigrationRunner = {
    async run({
        log,
        migrations,
        dataSource,
    }: {
        log: FastifyBaseLogger
        migrations?: (new () => BackgroundMigration)[]
        dataSource?: DataSource
    }): Promise<void> {
        const ds = dataSource ?? databaseConnection()
        const source = migrations ?? getBackgroundMigrations()
        await ensureBackgroundMigrationsTable(ds)
        const completed = await getCompletedNames(ds)
        const pending = source
            .map(MigrationClass => new MigrationClass())
            .filter(instance => !completed.has(instance.name))

        log.info({ pendingCount: pending.length }, '[backgroundMigrationRunner] Starting run')
        wideEvent.set({ backgroundMigrationCount: pending.length })

        for (const migration of pending) {
            await runOne({ migration, log, dataSource: ds })
        }
    },

    async getStatus({
        migrations,
        dataSource,
    }: {
        migrations?: (new () => BackgroundMigration)[]
        dataSource?: DataSource
    } = {}): Promise<BackgroundMigrationStatus> {
        const ds = dataSource ?? databaseConnection()
        const source = migrations ?? getBackgroundMigrations()
        const { error } = await tryCatch(async () => ensureBackgroundMigrationsTable(ds))
        if (error) {
            return { pendingCount: 0, completedCount: 0, error: error instanceof Error ? error.message : String(error), failedMigration: null }
        }
        const completed = await getCompletedNames(ds)
        const sourceNames = source.map(MigrationClass => new MigrationClass().name)
        const pendingCount = sourceNames.filter(name => !completed.has(name)).length
        const failedMigration = await getLatestFailure(ds, sourceNames)
        return {
            pendingCount,
            completedCount: source.length - pendingCount,
            error: null,
            failedMigration,
        }
    },
}

async function runOne({
    migration,
    log,
    dataSource,
}: {
    migration: BackgroundMigration
    log: FastifyBaseLogger
    dataSource: DataSource
}): Promise<void> {
    const startedAt = Date.now()
    log.info({ migration: { name: migration.name } }, '[backgroundMigrationRunner] Running migration')

    const queryRunner = dataSource.createQueryRunner()
    try {
        try {
            await migration.up(queryRunner)
        }
        finally {
            await queryRunner.release()
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await dataSource.query(
            `INSERT INTO "${BACKGROUND_MIGRATIONS_TABLE}" ("name", "failed_at", "last_error") VALUES ($1, NOW(), $2)
             ON CONFLICT ("name") DO UPDATE SET "failed_at" = NOW(), "last_error" = EXCLUDED."last_error"`,
            [migration.name, message],
        )
        log.error({ migration: { name: migration.name }, error: message }, '[backgroundMigrationRunner] Migration failed')
        throw error
    }

    await dataSource.query(
        `INSERT INTO "${BACKGROUND_MIGRATIONS_TABLE}" ("name", "executed_at") VALUES ($1, NOW())
         ON CONFLICT ("name") DO UPDATE SET "executed_at" = NOW(), "failed_at" = NULL, "last_error" = NULL`,
        [migration.name],
    )
    const durationMs = Date.now() - startedAt
    log.info({ migration: { name: migration.name }, durationMs }, '[backgroundMigrationRunner] Migration completed')
}

let backgroundMigrationsTableEnsured = false

async function ensureBackgroundMigrationsTable(dataSource: DataSource): Promise<void> {
    if (backgroundMigrationsTableEnsured) return
    await dataSource.query(
        `CREATE TABLE IF NOT EXISTS "${BACKGROUND_MIGRATIONS_TABLE}" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" TEXT NOT NULL UNIQUE,
            "executed_at" TIMESTAMPTZ NULL,
            "failed_at" TIMESTAMPTZ NULL,
            "last_error" TEXT NULL
        )`,
    )
    backgroundMigrationsTableEnsured = true
}

async function getCompletedNames(dataSource: DataSource): Promise<Set<string>> {
    const rows = await dataSource.query(
        `SELECT "name" FROM "${BACKGROUND_MIGRATIONS_TABLE}" WHERE "executed_at" IS NOT NULL`,
    ) as { name: string }[]
    return new Set(rows.map(row => row.name))
}

async function getLatestFailure(dataSource: DataSource, sourceNames: string[]): Promise<FailedBackgroundMigration | null> {
    if (sourceNames.length === 0) return null
    const rows = await dataSource.query(
        `SELECT "name", "failed_at", "last_error"
           FROM "${BACKGROUND_MIGRATIONS_TABLE}"
          WHERE "executed_at" IS NULL
            AND "failed_at" IS NOT NULL
            AND "name" = ANY($1)
          ORDER BY "failed_at" DESC
          LIMIT 1`,
        [sourceNames],
    ) as { name: string, failed_at: Date | string, last_error: string }[]
    const row = rows[0]
    if (!row) return null
    const failedAt = row.failed_at instanceof Date ? row.failed_at.toISOString() : row.failed_at
    return { name: row.name, failedAt, lastError: row.last_error }
}

export const BACKGROUND_MIGRATIONS_TABLE = 'background_migrations'

export type FailedBackgroundMigration = {
    name: string
    failedAt: string
    lastError: string
}

export type BackgroundMigrationStatus = {
    pendingCount: number
    completedCount: number
    error: string | null
    failedMigration: FailedBackgroundMigration | null
}
