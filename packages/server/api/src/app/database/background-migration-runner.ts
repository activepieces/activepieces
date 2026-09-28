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
        await ensureTable(ds)
        const completed = await getCompletedNames(ds)
        const pending = source
            .map(MigrationClass => new MigrationClass())
            .filter(instance => !completed.has(instance.name))

        log.info({ pendingCount: pending.length }, '[backgroundMigrationRunner] Starting run')

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
        const { error } = await tryCatch(async () => ensureTable(ds))
        if (error) return { pendingCount: 0, completedCount: 0 }
        const completed = await getCompletedNames(ds)
        const pendingCount = source
            .map(MigrationClass => new MigrationClass().name)
            .filter(name => !completed.has(name))
            .length
        return {
            pendingCount,
            completedCount: source.length - pendingCount,
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
    wideEvent.set({ migration: { name: migration.name, kind: 'background' } })
    log.info({ migration: { name: migration.name } }, '[backgroundMigrationRunner] Running migration')

    await wideEvent.timed({
        name: 'backgroundMigration',
        fn: async () => {
            const queryRunner = dataSource.createQueryRunner()
            try {
                await migration.up(queryRunner)
            }
            finally {
                await queryRunner.release()
            }
            await dataSource.query(
                `INSERT INTO "${BACKGROUND_MIGRATIONS_TABLE}" ("name", "executed_at") VALUES ($1, NOW())`,
                [migration.name],
            )
            log.info({ migration: { name: migration.name } }, '[backgroundMigrationRunner] Migration completed')
        },
    })
}

async function ensureTable(dataSource: DataSource): Promise<void> {
    await dataSource.query(
        `CREATE TABLE IF NOT EXISTS "${BACKGROUND_MIGRATIONS_TABLE}" (
            "id" BIGSERIAL PRIMARY KEY,
            "name" TEXT NOT NULL UNIQUE,
            "executed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
    )
}

async function getCompletedNames(dataSource: DataSource): Promise<Set<string>> {
    const rows = await dataSource.query(
        `SELECT "name" FROM "${BACKGROUND_MIGRATIONS_TABLE}"`,
    ) as { name: string }[]
    return new Set(rows.map(row => row.name))
}

export const BACKGROUND_MIGRATIONS_TABLE = 'background_migrations'

export type BackgroundMigrationStatus = {
    pendingCount: number
    completedCount: number
}
