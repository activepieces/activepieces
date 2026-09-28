import { FastifyInstance } from 'fastify'
import { QueryRunner } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BackgroundMigration } from '../../../../src/app/database/background-migration'
import {
    BACKGROUND_MIGRATIONS_TABLE,
    backgroundMigrationRunner,
} from '../../../../src/app/database/background-migration-runner'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { migrationHelpers } from '../../../../src/app/database/migration-helpers'
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

    it('does not record a migration whose up() throws', async () => {
        const MigrationClass = makeTestMigration({
            name: `Failing${Date.now()}`,
            up: async () => { throw new Error('boom') },
        })
        await expect(
            backgroundMigrationRunner.run({ log: app!.log, migrations: [MigrationClass] }),
        ).rejects.toThrow(/boom/)
        const rows = await selectByName(new MigrationClass().name)
        expect(rows).toHaveLength(0)
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

    it('reports pending count via getStatus', async () => {
        const done = makeTestMigration({ name: `StatusDone${Date.now()}` })
        const pending = makeTestMigration({ name: `StatusPending${Date.now()}` })
        await backgroundMigrationRunner.run({ log: app!.log, migrations: [done] })

        const status = await backgroundMigrationRunner.getStatus({ migrations: [done, pending] })
        expect(status.pendingCount).toBe(1)
        expect(status.completedCount).toBeGreaterThanOrEqual(1)
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
        `SELECT "name" FROM "${BACKGROUND_MIGRATIONS_TABLE}"`,
    ) as { name: string }[]
    return rows.filter(row => row.name === name)
}
