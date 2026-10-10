import { tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration, wideEvent } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { DataSource } from 'typeorm'
import { BackgroundMigration } from './background-migration'
import { databaseConnection } from './database-connection'
import { BackgroundMigrationNotCompleteError } from './migration-helpers'
import { getBackgroundMigrations } from './postgres-connection'
import { distributedLock } from './redis-connections'

export const backgroundMigrationRunner = {
    async ensureTable({ dataSource }: { dataSource?: DataSource } = {}): Promise<void> {
        const ds = dataSource ?? databaseConnection()
        await ensureBackgroundMigrationsTable(ds)
    },

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

        log.info({ migration: { pendingCount: pending.length } }, '[backgroundMigrationRunner] Starting run')
        wideEvent.set({ migration: { pendingCount: pending.length } })

        for (const migration of pending) {
            await runOne({ migration, log, dataSource: ds })
        }
    },

    async runMigrationsWithCatchup({
        dataSource,
        log,
    }: {
        dataSource: DataSource
        log: FastifyBaseLogger
    }): Promise<void> {
        await ensureBackgroundMigrationsTable(dataSource)
        for (let attempt = 1; attempt <= MAX_CATCHUP_ATTEMPTS; attempt++) {
            const { error } = await tryCatch(async () => dataSource.runMigrations())
            if (!error) return
            if (!(error instanceof BackgroundMigrationNotCompleteError)) throw error
            const name = new error.migration().name
            log.info({ migration: { name } }, '[runMigrationsWithCatchup] Catching up prior-release backfill before retrying blocking migrations')
            const { error: catchupError } = await tryCatch(async () =>
                backgroundMigrationRunner.run({ log, migrations: [error.migration], dataSource }),
            )
            if (catchupError) {
                throw new Error(
                    `Boot catchup for background migration "${name}" failed. See background_migrations.last_error.`,
                    { cause: catchupError },
                )
            }
        }
        throw new Error(`runMigrationsWithCatchup exceeded ${MAX_CATCHUP_ATTEMPTS} attempts; too many distinct backfill dependencies or a loop`)
    },

    async getStatus({
        migrations,
        dataSource,
    }: {
        migrations?: (new () => BackgroundMigration)[]
        dataSource?: DataSource
    } = {}): Promise<BackgroundMigrationStatus> {
        const { data, error } = await tryCatch(async () => {
            const ds = dataSource ?? databaseConnection()
            const source = migrations ?? getBackgroundMigrations()
            await ensureBackgroundMigrationsTable(ds)
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
        })
        if (error) {
            return { pendingCount: 0, completedCount: 0, error: error instanceof Error ? error.message : String(error), failedMigration: null }
        }
        return data
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
    await distributedLock(log).runExclusive({
        key: `background_migration:${migration.name}`,
        timeoutInSeconds: RUN_LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const completed = await getCompletedNames(dataSource)
            if (completed.has(migration.name)) {
                log.info({ migration: { name: migration.name } }, '[backgroundMigrationRunner] Migration already completed under another lock holder, skipping')
                return
            }
            log.info({ migration: { name: migration.name } }, '[backgroundMigrationRunner] Running migration')
            wideEvent.set({ migration: { name: migration.name } })
            await wideEvent.timed({
                name: 'backgroundMigration',
                fn: () => executeMigrationBody({ migration, log, dataSource }),
            })
        },
    })
}

async function executeMigrationBody({
    migration,
    log,
    dataSource,
}: {
    migration: BackgroundMigration
    log: FastifyBaseLogger
    dataSource: DataSource
}): Promise<void> {
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
        const { error: recordError } = await tryCatch(async () => dataSource.query(
            `INSERT INTO "${BACKGROUND_MIGRATIONS_TABLE}" ("name", "failed_at", "last_error") VALUES ($1, NOW(), $2)
             ON CONFLICT ("name") DO UPDATE SET "failed_at" = NOW(), "last_error" = EXCLUDED."last_error"`,
            [migration.name, message],
        ))
        if (recordError) {
            log.error({ migration: { name: migration.name }, error: recordError instanceof Error ? recordError.message : String(recordError) }, '[backgroundMigrationRunner] Failed to persist migration failure; original error follows')
        }
        log.error({ migration: { name: migration.name }, error: message }, '[backgroundMigrationRunner] Migration failed')
        throw error
    }

    await dataSource.query(
        `INSERT INTO "${BACKGROUND_MIGRATIONS_TABLE}" ("name", "executed_at") VALUES ($1, NOW())
         ON CONFLICT ("name") DO UPDATE SET "executed_at" = NOW(), "failed_at" = NULL, "last_error" = NULL`,
        [migration.name],
    )
    log.info({ migration: { name: migration.name } }, '[backgroundMigrationRunner] Migration completed')
}

async function ensureBackgroundMigrationsTable(dataSource: DataSource): Promise<void> {
    await dataSource.query(
        `CREATE TABLE IF NOT EXISTS "${BACKGROUND_MIGRATIONS_TABLE}" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" TEXT NOT NULL UNIQUE,
            "executed_at" TIMESTAMPTZ NULL,
            "failed_at" TIMESTAMPTZ NULL,
            "last_error" TEXT NULL
        )`,
    )
}

async function getCompletedNames(dataSource: DataSource): Promise<Set<string>> {
    const rows: unknown = await dataSource.query(
        `SELECT "name" FROM "${BACKGROUND_MIGRATIONS_TABLE}" WHERE "executed_at" IS NOT NULL`,
    )
    const names = new Set<string>()
    if (!Array.isArray(rows)) return names
    for (const row of rows) {
        if (row !== null && typeof row === 'object' && 'name' in row && typeof row.name === 'string') {
            names.add(row.name)
        }
    }
    return names
}

async function getLatestFailure(dataSource: DataSource, sourceNames: string[]): Promise<FailedBackgroundMigration | null> {
    if (sourceNames.length === 0) return null
    const rows: unknown = await dataSource.query(
        `SELECT "name", "failed_at", "last_error"
           FROM "${BACKGROUND_MIGRATIONS_TABLE}"
          WHERE "executed_at" IS NULL
            AND "failed_at" IS NOT NULL
            AND "name" = ANY($1)
          ORDER BY "failed_at" DESC
          LIMIT 1`,
        [sourceNames],
    )
    if (!Array.isArray(rows) || rows.length === 0) return null
    const [row] = rows
    if (row === null || typeof row !== 'object') return null
    if (!('name' in row) || typeof row.name !== 'string') return null
    if (!('failed_at' in row)) return null
    if (!('last_error' in row) || typeof row.last_error !== 'string') return null
    const failedAt = row.failed_at instanceof Date ? row.failed_at.toISOString() : String(row.failed_at)
    return { name: row.name, failedAt, lastError: row.last_error }
}

const MAX_CATCHUP_ATTEMPTS = 10
const RUN_LOCK_TIMEOUT_SECONDS = apDayjsDuration(1, 'hour').asSeconds()

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
