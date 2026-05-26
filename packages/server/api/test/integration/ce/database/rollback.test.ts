import { QueryRunner } from 'typeorm'
import { databaseConnection, resetDatabaseConnection } from '../../../../src/app/database/database-connection'
import { initializeDatabase } from '../../../../src/app/database'
import { Migration } from '../../../../src/app/database/migration'
import { identifyCandidatesByManifest, identifyReleaseCandidates, verifyDatabaseState } from '../../../../src/app/database/rollback-migrations'

const TEST_TABLE = 'rollback_test_table'

class TestMigrationSafe1999000000001 implements Migration {
    name = 'TestMigrationSafe1999000000001'
    breaking = false
    release = '99.0.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "${TEST_TABLE}" ("id" varchar PRIMARY KEY, "value" varchar)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "${TEST_TABLE}"`)
    }
}

class TestMigrationSafe1999000000002 implements Migration {
    name = 'TestMigrationSafe1999000000002'
    breaking = false
    release = '99.0.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${TEST_TABLE}" ADD COLUMN "extra" varchar`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${TEST_TABLE}" DROP COLUMN "extra"`)
    }
}

class TestMigrationBreaking1999000000003 implements Migration {
    name = 'TestMigrationBreaking1999000000003'
    breaking = true
    release = '99.1.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${TEST_TABLE}" ADD COLUMN "breaking_col" varchar`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${TEST_TABLE}" DROP COLUMN "breaking_col"`)
    }
}

async function applyTestMigration(ds: ReturnType<typeof databaseConnection>, migration: Migration): Promise<void> {
    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await migration.up(queryRunner)
    await queryRunner.release()
    await ds.query(
        `INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`,
        [Date.now(), migration.name],
    )
}

async function revertTestMigration(ds: ReturnType<typeof databaseConnection>, migration: Migration): Promise<void> {
    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await migration.down(queryRunner)
    await queryRunner.release()
    await ds.query(`DELETE FROM "migrations" WHERE "name" = $1`, [migration.name])
}

async function cleanupTestState(ds: ReturnType<typeof databaseConnection>): Promise<void> {
    await ds.query(`DROP TABLE IF EXISTS "${TEST_TABLE}"`).catch(() => { /* ignore */ })
    await ds.query(`DELETE FROM "migrations" WHERE "name" LIKE 'TestMigration%'`).catch(() => { /* ignore */ })
}

async function getTableColumns(ds: ReturnType<typeof databaseConnection>, tableName: string): Promise<string[]> {
    const columns = await ds.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [tableName],
    )
    return columns.map((c: { column_name: string }) => c.column_name)
}

async function tableExists(ds: ReturnType<typeof databaseConnection>, tableName: string): Promise<boolean> {
    const result = await ds.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
        [tableName],
    )
    return result.length > 0
}

describe('Rollback Integration', () => {
    let ds: ReturnType<typeof databaseConnection>

    beforeAll(async () => {
        resetDatabaseConnection()
        await initializeDatabase({ runMigrations: true })
        ds = databaseConnection()
    })

    afterAll(async () => {
        await cleanupTestState(ds)
        await ds.destroy()
    })

    afterEach(async () => {
        await cleanupTestState(ds)
    })

    describe('identifyReleaseCandidates', () => {
        it('should return migrations with release greater than target version in reverse order', () => {
            const migrations: (new () => Migration)[] = [
                TestMigrationSafe1999000000001,
                TestMigrationSafe1999000000002,
                TestMigrationBreaking1999000000003,
            ]

            const candidates = identifyReleaseCandidates(migrations, '98.0.0')

            expect(candidates).toHaveLength(3)
            expect(candidates[0].name).toBe('TestMigrationBreaking1999000000003')
            expect(candidates[1].name).toBe('TestMigrationSafe1999000000002')
            expect(candidates[2].name).toBe('TestMigrationSafe1999000000001')
        })

        it('should filter by version correctly', () => {
            const migrations: (new () => Migration)[] = [
                TestMigrationSafe1999000000001,
                TestMigrationSafe1999000000002,
                TestMigrationBreaking1999000000003,
            ]

            const candidates = identifyReleaseCandidates(migrations, '99.0.0')

            expect(candidates).toHaveLength(1)
            expect(candidates[0].name).toBe('TestMigrationBreaking1999000000003')
            expect(candidates[0].breaking).toBe(true)
        })

        it('should return empty when no migrations are newer than target', () => {
            const candidates = identifyReleaseCandidates([TestMigrationSafe1999000000001], '99.0.0')
            expect(candidates).toHaveLength(0)
        })

        it('should skip migrations without a release field', () => {
            const NoReleaseMigration = class implements Migration {
                name = 'NoRelease'
                async up(): Promise<void> { /* noop */ }
                async down(): Promise<void> { /* noop */ }
            }

            const candidates = identifyReleaseCandidates(
                [NoReleaseMigration, TestMigrationSafe1999000000001],
                '98.0.0',
            )

            expect(candidates).toHaveLength(1)
            expect(candidates[0].name).toBe('TestMigrationSafe1999000000001')
        })
    })

    describe('identifyCandidatesByManifest', () => {
        it('should return only the migration absent from the manifest in reverse order', () => {
            const migrations: (new () => Migration)[] = [
                TestMigrationSafe1999000000001,
                TestMigrationSafe1999000000002,
                TestMigrationBreaking1999000000003,
            ]

            const candidates = identifyCandidatesByManifest(migrations, [
                'TestMigrationSafe1999000000001',
                'TestMigrationSafe1999000000002',
            ])

            expect(candidates).toHaveLength(1)
            expect(candidates[0].name).toBe('TestMigrationBreaking1999000000003')
        })

        it('should return migration absent from manifest even when all share the same release version', () => {
            const SameReleaseMigration1 = class implements Migration {
                name = 'TestMigrationSafe1999000000001'
                breaking = false
                release = '99.0.0'
                async up(): Promise<void> { /* noop */ }
                async down(): Promise<void> { /* noop */ }
            }
            const SameReleaseMigration2 = class implements Migration {
                name = 'TestMigrationSafe1999000000002'
                breaking = false
                release = '99.0.0'
                async up(): Promise<void> { /* noop */ }
                async down(): Promise<void> { /* noop */ }
            }
            const SameReleaseMigration3 = class implements Migration {
                name = 'TestMigrationBreaking1999000000003'
                breaking = true
                release = '99.0.0'
                async up(): Promise<void> { /* noop */ }
                async down(): Promise<void> { /* noop */ }
            }

            const candidates = identifyCandidatesByManifest(
                [SameReleaseMigration1, SameReleaseMigration2, SameReleaseMigration3],
                ['TestMigrationSafe1999000000001', 'TestMigrationSafe1999000000002'],
            )

            expect(candidates).toHaveLength(1)
            expect(candidates[0].name).toBe('TestMigrationBreaking1999000000003')
        })

        it('should return empty when manifest lists all migrations', () => {
            const migrations: (new () => Migration)[] = [
                TestMigrationSafe1999000000001,
                TestMigrationSafe1999000000002,
                TestMigrationBreaking1999000000003,
            ]

            const candidates = identifyCandidatesByManifest(migrations, [
                'TestMigrationSafe1999000000001',
                'TestMigrationSafe1999000000002',
                'TestMigrationBreaking1999000000003',
            ])

            expect(candidates).toHaveLength(0)
        })

        it('should return all migrations in reverse order when manifest is empty', () => {
            const migrations: (new () => Migration)[] = [
                TestMigrationSafe1999000000001,
                TestMigrationSafe1999000000002,
                TestMigrationBreaking1999000000003,
            ]

            const candidates = identifyCandidatesByManifest(migrations, [])

            expect(candidates).toHaveLength(3)
            expect(candidates[0].name).toBe('TestMigrationBreaking1999000000003')
            expect(candidates[1].name).toBe('TestMigrationSafe1999000000002')
            expect(candidates[2].name).toBe('TestMigrationSafe1999000000001')
        })
    })

    describe('verifyDatabaseState', () => {
        it('should pass when database matches candidates in order', async () => {
            await applyTestMigration(ds, new TestMigrationSafe1999000000001())
            await applyTestMigration(ds, new TestMigrationSafe1999000000002())

            const candidates = [
                new TestMigrationSafe1999000000002(),
                new TestMigrationSafe1999000000001(),
            ]

            await expect(verifyDatabaseState(ds, candidates)).resolves.toBeUndefined()
        })

        it('should throw when database order does not match', async () => {
            await applyTestMigration(ds, new TestMigrationSafe1999000000001())
            await applyTestMigration(ds, new TestMigrationSafe1999000000002())

            const wrongOrder = [
                new TestMigrationSafe1999000000001(),
                new TestMigrationSafe1999000000002(),
            ]

            await expect(verifyDatabaseState(ds, wrongOrder)).rejects.toThrow('Migration order mismatch')
        })
    })

    describe('migration up/down lifecycle', () => {
        it('should apply and revert two safe migrations', async () => {
            const m1 = new TestMigrationSafe1999000000001()
            const m2 = new TestMigrationSafe1999000000002()

            // Apply forward
            await applyTestMigration(ds, m1)
            await applyTestMigration(ds, m2)

            expect(await tableExists(ds, TEST_TABLE)).toBe(true)
            expect(await getTableColumns(ds, TEST_TABLE)).toEqual(
                expect.arrayContaining(['id', 'value', 'extra']),
            )

            // Revert m2 — drops "extra" column
            await revertTestMigration(ds, m2)
            expect(await tableExists(ds, TEST_TABLE)).toBe(true)
            expect(await getTableColumns(ds, TEST_TABLE)).not.toContain('extra')

            // Revert m1 — drops table
            await revertTestMigration(ds, m1)
            expect(await tableExists(ds, TEST_TABLE)).toBe(false)

            // Migration records cleaned up
            const remaining = await ds.query(
                `SELECT "name" FROM "migrations" WHERE "name" LIKE 'TestMigration%'`,
            )
            expect(remaining).toHaveLength(0)
        })

        it('should apply and revert three migrations including a breaking one', async () => {
            const m1 = new TestMigrationSafe1999000000001()
            const m2 = new TestMigrationSafe1999000000002()
            const m3 = new TestMigrationBreaking1999000000003()

            await applyTestMigration(ds, m1)
            await applyTestMigration(ds, m2)
            await applyTestMigration(ds, m3)

            expect(await getTableColumns(ds, TEST_TABLE)).toEqual(
                expect.arrayContaining(['id', 'value', 'extra', 'breaking_col']),
            )

            // Revert m3 (breaking)
            await revertTestMigration(ds, m3)
            expect(await getTableColumns(ds, TEST_TABLE)).not.toContain('breaking_col')
            expect(await getTableColumns(ds, TEST_TABLE)).toContain('extra')

            // Revert m2
            await revertTestMigration(ds, m2)
            expect(await getTableColumns(ds, TEST_TABLE)).not.toContain('extra')

            // Revert m1
            await revertTestMigration(ds, m1)
            expect(await tableExists(ds, TEST_TABLE)).toBe(false)
        })
    })
})
