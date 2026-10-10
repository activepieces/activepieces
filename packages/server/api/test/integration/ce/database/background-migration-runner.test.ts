import { FastifyInstance } from 'fastify'
import { QueryRunner } from 'typeorm'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { BackgroundMigration } from '../../../../src/app/database/background-migration'
import {
    BACKGROUND_MIGRATIONS_TABLE,
    backgroundMigrationRunner,
} from '../../../../src/app/database/background-migration-runner'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { BackgroundMigrationNotCompleteError, migrationHelpers } from '../../../../src/app/database/migration-helpers'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('backgroundMigrationRunner', () => {
    it('runs a pending background migration and records it in background_migrations', async () => {
        const MigrationClass = makeTestMigration({ name: `HappyPath${Date.now()}` })
        await backgroundMigrationRunner.run({
            log: app!.log,
            migrations: [MigrationClass],
        })
        const rows = await selectByName(new MigrationClass().name)
        expect(rows).toHaveLength(1)
    })

    it('records a failed migration with its error and does not mark it completed', async () => {
        const MigrationClass = makeTestMigration({
            name: `Failing${Date.now()}`,
            up: async () => { throw new Error('boom') },
        })
        await expect(
            backgroundMigrationRunner.run({ log: app!.log, migrations: [MigrationClass] }),
        ).rejects.toThrow(/boom/)
        const name = new MigrationClass().name
        const completed = await selectCompletedByName(name)
        expect(completed).toHaveLength(0)
        const status = await backgroundMigrationRunner.getStatus({ migrations: [MigrationClass] })
        expect(status.failedMigration?.name).toBe(name)
        expect(status.failedMigration?.lastError).toMatch(/boom/)
    })

    it('clears failure state when a previously failed migration succeeds on retry', async () => {
        let shouldFail = true
        const name = `RetrySucceeds${Date.now()}`
        const MigrationClass = makeTestMigration({
            name,
            up: async () => { if (shouldFail) throw new Error('transient') },
        })
        await expect(
            backgroundMigrationRunner.run({ log: app!.log, migrations: [MigrationClass] }),
        ).rejects.toThrow(/transient/)
        shouldFail = false
        await backgroundMigrationRunner.run({ log: app!.log, migrations: [MigrationClass] })
        const status = await backgroundMigrationRunner.getStatus({ migrations: [MigrationClass] })
        expect(status.failedMigration).toBeNull()
        expect(status.pendingCount).toBe(0)
    })

    it('skips a migration that has already completed', async () => {
        let upCalls = 0
        const MigrationClass = makeTestMigration({
            name: `Idempotent${Date.now()}`,
            up: async () => { upCalls++ },
        })
        await backgroundMigrationRunner.run({ log: app!.log, migrations: [MigrationClass] })
        await backgroundMigrationRunner.run({ log: app!.log, migrations: [MigrationClass] })
        expect(upCalls).toBe(1)
    })

    it('assertBackgroundMigrationComplete gates a blocking migration until the backfill runs', async () => {
        const backfill = makeTestMigration({ name: `GateBackfill${Date.now()}` })
        const contract = async (queryRunner: QueryRunner): Promise<void> => {
            await migrationHelpers.assertBackgroundMigrationComplete({
                queryRunner,
                migration: backfill,
            })
        }
        const preRun = databaseConnection().createQueryRunner()
        try {
            await expect(contract(preRun)).rejects.toThrow(/GateBackfill.*has not completed/)
        }
        finally {
            await preRun.release()
        }

        await backgroundMigrationRunner.run({ log: app!.log, migrations: [backfill] })

        const postRun = databaseConnection().createQueryRunner()
        try {
            await expect(contract(postRun)).resolves.toBeUndefined()
        }
        finally {
            await postRun.release()
        }
    })

    it('assertBackgroundMigrationComplete rejects a backfill that only failed', async () => {
        const backfill = makeTestMigration({
            name: `FailedGate${Date.now()}`,
            up: async () => { throw new Error('kaboom') },
        })
        await expect(
            backgroundMigrationRunner.run({ log: app!.log, migrations: [backfill] }),
        ).rejects.toThrow(/kaboom/)

        const queryRunner = databaseConnection().createQueryRunner()
        try {
            await expect(migrationHelpers.assertBackgroundMigrationComplete({
                queryRunner,
                migration: backfill,
            })).rejects.toThrow(/FailedGate.*has not completed/)
        }
        finally {
            await queryRunner.release()
        }
    })

    it('reports pending count via getStatus', async () => {
        const done = makeTestMigration({ name: `StatusDone${Date.now()}` })
        const pending = makeTestMigration({ name: `StatusPending${Date.now()}` })
        await backgroundMigrationRunner.run({ log: app!.log, migrations: [done] })

        const status = await backgroundMigrationRunner.getStatus({ migrations: [done, pending] })
        expect(status.pendingCount).toBe(1)
        expect(status.completedCount).toBeGreaterThanOrEqual(1)
    })

})

describe('runMigrationsWithCatchup', () => {
    afterEach(() => vi.restoreAllMocks())

    it('runs the backfill when a blocking migration throws BackgroundMigrationNotCompleteError', async () => {
        const Backfill = makeTestMigration({ name: `CatchupBackfill${Date.now()}` })
        const ds = databaseConnection()
        let runMigrationsCalls = 0
        vi.spyOn(ds, 'runMigrations').mockImplementation(async () => {
            runMigrationsCalls++
            if (runMigrationsCalls === 1) throw new BackgroundMigrationNotCompleteError(Backfill)
            return []
        })

        await backgroundMigrationRunner.runMigrationsWithCatchup({ dataSource: ds, log: app!.log })
        expect(runMigrationsCalls).toBe(2)
        const rows = await selectByName(new Backfill().name)
        expect(rows).toHaveLength(1)
    })

    it('rethrows non-NotComplete errors immediately', async () => {
        const ds = databaseConnection()
        vi.spyOn(ds, 'runMigrations').mockRejectedValueOnce(new Error('syntax error'))
        await expect(
            backgroundMigrationRunner.runMigrationsWithCatchup({ dataSource: ds, log: app!.log }),
        ).rejects.toThrow(/syntax error/)
    })

    it('fails fast when the catchup backfill itself throws', async () => {
        const BrokenBackfill = makeTestMigration({
            name: `BrokenCatchup${Date.now()}`,
            up: async () => { throw new Error('backfill bug') },
        })
        const ds = databaseConnection()
        vi.spyOn(ds, 'runMigrations').mockRejectedValue(new BackgroundMigrationNotCompleteError(BrokenBackfill))
        await expect(
            backgroundMigrationRunner.runMigrationsWithCatchup({ dataSource: ds, log: app!.log }),
        ).rejects.toThrow(/Boot catchup.*BrokenCatchup.*backfill bug/)
    })
})

function makeTestMigration({
    name: migrationName,
    up: upFn = async () => { /* no-op */ },
}: {
    name: string
    up?: (queryRunner: QueryRunner) => Promise<void>
}): new () => BackgroundMigration {
    return class implements BackgroundMigration {
        name = migrationName
        release = '0.0.0-test'
        transaction = false as const
        public async up(queryRunner: QueryRunner): Promise<void> { await upFn(queryRunner) }
        public async down(): Promise<void> { /* no-op */ }
    }
}

async function selectByName(name: string): Promise<{ name: string }[]> {
    const rows = await databaseConnection().query(
        `SELECT "name" FROM "${BACKGROUND_MIGRATIONS_TABLE}" WHERE "executed_at" IS NOT NULL`,
    ) as { name: string }[]
    return rows.filter(row => row.name === name)
}

async function selectCompletedByName(name: string): Promise<{ name: string }[]> {
    return selectByName(name)
}
