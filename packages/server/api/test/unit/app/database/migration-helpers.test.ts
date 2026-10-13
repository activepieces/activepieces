import { QueryRunner } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackgroundMigration } from '../../../../src/app/database/background-migration'
import { DatabaseType } from '../../../../src/app/database/database-type'
import { migrationHelpers } from '../../../../src/app/database/migration-helpers'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'

describe('createIndexConcurrently (postgres)', () => {
    beforeEach(() => {
        vi.spyOn(system, 'get').mockImplementation((prop) => prop === AppSystemProp.DB_TYPE ? DatabaseType.POSTGRES : undefined)
    })
    afterEach(() => vi.restoreAllMocks())

    it('is a no-op when the index already exists and is valid', async () => {
        const queryRunner = mockQueryRunner([{ indisvalid: true }])
        await migrationHelpers.createIndexConcurrently({ queryRunner, name: 'idx_foo', table: 'foo', columns: '"bar"' })
        expect(queryRunner.query).toHaveBeenCalledTimes(1)
        expect(queryRunner.query).toHaveBeenCalledWith(expect.stringContaining('pg_index'), ['idx_foo'])
    })

    it('reindexes when an invalid index is present', async () => {
        const queryRunner = mockQueryRunner([{ indisvalid: false }], [])
        await migrationHelpers.createIndexConcurrently({ queryRunner, name: 'idx_foo', table: 'foo', columns: '"bar"' })
        expect(queryRunner.query).toHaveBeenNthCalledWith(2, 'REINDEX INDEX CONCURRENTLY "idx_foo"')
    })

    it('creates the index when it is missing', async () => {
        const queryRunner = mockQueryRunner([], [])
        await migrationHelpers.createIndexConcurrently({ queryRunner, name: 'idx_foo', table: 'foo', columns: '"bar"', where: `"kind" = 'active'` })
        const secondCall = (queryRunner.query as ReturnType<typeof vi.fn>).mock.calls[1][0]
        expect(secondCall).toBe(`CREATE INDEX CONCURRENTLY "idx_foo" ON "foo" ("bar") WHERE "kind" = 'active'`)
    })

    it('supports UNIQUE indexes', async () => {
        const queryRunner = mockQueryRunner([], [])
        await migrationHelpers.createIndexConcurrently({ queryRunner, name: 'idx_foo_unique', table: 'foo', columns: '"bar"', unique: true })
        const secondCall = (queryRunner.query as ReturnType<typeof vi.fn>).mock.calls[1][0]
        expect(secondCall).toBe(`CREATE UNIQUE INDEX CONCURRENTLY "idx_foo_unique" ON "foo" ("bar")`)
    })
})

describe('createIndexConcurrently (pglite)', () => {
    beforeEach(() => {
        vi.spyOn(system, 'get').mockImplementation((prop) => prop === AppSystemProp.DB_TYPE ? DatabaseType.PGLITE : undefined)
    })
    afterEach(() => vi.restoreAllMocks())

    it('falls back to a plain CREATE INDEX IF NOT EXISTS', async () => {
        const queryRunner = mockQueryRunner([])
        await migrationHelpers.createIndexConcurrently({ queryRunner, name: 'idx_foo', table: 'foo', columns: '"bar"' })
        expect(queryRunner.query).toHaveBeenCalledTimes(1)
        expect(queryRunner.query).toHaveBeenCalledWith(`CREATE INDEX IF NOT EXISTS "idx_foo" ON "foo" ("bar")`)
    })
})

describe('dropIndexConcurrently', () => {
    afterEach(() => vi.restoreAllMocks())

    it('emits DROP INDEX CONCURRENTLY IF EXISTS on postgres', async () => {
        vi.spyOn(system, 'get').mockImplementation((prop) => prop === AppSystemProp.DB_TYPE ? DatabaseType.POSTGRES : undefined)
        const queryRunner = mockQueryRunner([])
        await migrationHelpers.dropIndexConcurrently({ queryRunner, name: 'idx_foo' })
        expect(queryRunner.query).toHaveBeenCalledWith(`DROP INDEX CONCURRENTLY IF EXISTS "idx_foo"`)
    })

    it('omits CONCURRENTLY on pglite', async () => {
        vi.spyOn(system, 'get').mockImplementation((prop) => prop === AppSystemProp.DB_TYPE ? DatabaseType.PGLITE : undefined)
        const queryRunner = mockQueryRunner([])
        await migrationHelpers.dropIndexConcurrently({ queryRunner, name: 'idx_foo' })
        expect(queryRunner.query).toHaveBeenCalledWith(`DROP INDEX  IF EXISTS "idx_foo"`)
    })
})

describe('assertBackgroundMigrationComplete', () => {
    class TestBackfill implements BackgroundMigration {
        name = 'TestBackfill1234'
        release = '0.91.0'
        transaction = false as const
        public async up(): Promise<void> { /* no-op */ }
        public async down(): Promise<void> { /* no-op */ }
    }

    it('resolves when the row is present', async () => {
        const queryRunner = mockQueryRunner([{}])
        await expect(
            migrationHelpers.assertBackgroundMigrationComplete({ queryRunner, migration: TestBackfill }),
        ).resolves.toBeUndefined()
    })

    it('throws when the row is absent', async () => {
        const queryRunner = mockQueryRunner([])
        await expect(
            migrationHelpers.assertBackgroundMigrationComplete({ queryRunner, migration: TestBackfill }),
        ).rejects.toThrow(/TestBackfill1234.*has not completed/)
    })
})

function mockQueryRunner(...responses: unknown[]): QueryRunner {
    const query = vi.fn()
    responses.forEach(response => query.mockResolvedValueOnce(response))
    return { query } as unknown as QueryRunner
}
