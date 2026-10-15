import { DataSource } from 'typeorm'
import { createMockProjectMember, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection, resetDatabaseConnection } from '../../../../src/app/database/database-connection'
import { UniqueProjectRoleNamePerPlatform1852000000000 } from '../../../../src/app/database/migration/postgres/1852000000000-UniqueProjectRoleNamePerPlatform'

const INDEX_NAME = 'idx_project_role_platform_id_name'
const ID_PREFIX = 'zzMig'
const PLATFORM_A = id('platformA')
const PLATFORM_B = id('platformB')
const PLATFORM_C = id('platformC')

function id(seed: string): string {
    return `${ID_PREFIX}${seed}`.padEnd(21, '0').slice(0, 21)
}

async function seedRole(ds: DataSource, params: { seed: string, platformId: string | null, name: string, created: string }): Promise<void> {
    await ds.query(
        'INSERT INTO "project_role" ("id", "created", "updated", "name", "permissions", "platformId", "type") VALUES ($1, $2, $2, $3, $4, $5, $6)',
        [id(params.seed), params.created, params.name, [], params.platformId, 'CUSTOM'],
    )
}

async function nameOf(ds: DataSource, seed: string): Promise<string> {
    const [row] = await ds.query('SELECT "name" FROM "project_role" WHERE "id" = $1', [id(seed)])
    return row.name
}

async function runMigration(ds: DataSource): Promise<void> {
    const queryRunner = ds.createQueryRunner()
    await queryRunner.connect()
    await new UniqueProjectRoleNamePerPlatform1852000000000().up(queryRunner)
    await queryRunner.release()
}

async function cleanup(ds: DataSource): Promise<void> {
    await ds.query(`DELETE FROM "project_member" WHERE "projectRoleId" LIKE '${ID_PREFIX}%'`)
    await ds.query(`DELETE FROM "project_role" WHERE "id" LIKE '${ID_PREFIX}%'`)
}

describe('UniqueProjectRoleNamePerPlatform migration', () => {
    let ds: DataSource

    beforeAll(async () => {
        resetDatabaseConnection()
        await initializeDatabase({ runMigrations: true })
        ds = databaseConnection()
    })

    afterAll(async () => {
        await cleanup(ds)
        await ds.destroy()
    })

    beforeEach(async () => {
        await cleanup(ds)
        await ds.query(`DROP INDEX IF EXISTS "${INDEX_NAME}"`)
    })

    it('keeps one copy and suffixes the rest, treating case variants as the same name', async () => {
        await seedRole(ds, { seed: 'caseA', platformId: PLATFORM_A, name: 'Manager', created: '2024-01-01T00:00:00Z' })
        await seedRole(ds, { seed: 'caseB', platformId: PLATFORM_A, name: 'manager', created: '2024-01-02T00:00:00Z' })
        await seedRole(ds, { seed: 'caseC', platformId: PLATFORM_A, name: 'MANAGER', created: '2024-01-03T00:00:00Z' })

        await runMigration(ds)

        expect(await nameOf(ds, 'caseA')).toBe('Manager')
        const renamed = [await nameOf(ds, 'caseB'), await nameOf(ds, 'caseC')]
        expect(renamed.sort()).toEqual(['Manager (2)', 'Manager (3)'])
    })

    it('walks past a suffix already taken in another capitalisation', async () => {
        await seedRole(ds, { seed: 'takenA', platformId: PLATFORM_B, name: 'Editor', created: '2024-01-01T00:00:00Z' })
        await seedRole(ds, { seed: 'takenB', platformId: PLATFORM_B, name: 'Editor', created: '2024-01-02T00:00:00Z' })
        await seedRole(ds, { seed: 'takenC', platformId: PLATFORM_B, name: 'EDITOR (2)', created: '2024-01-03T00:00:00Z' })

        await runMigration(ds)

        expect(await nameOf(ds, 'takenA')).toBe('Editor')
        expect(await nameOf(ds, 'takenB')).toBe('Editor (3)')
        expect(await nameOf(ds, 'takenC')).toBe('EDITOR (2)')
    })

    it('leaves the same name on another platform, and platform-less rows, alone', async () => {
        await seedRole(ds, { seed: 'otherA', platformId: PLATFORM_A, name: 'Manager', created: '2024-01-01T00:00:00Z' })
        await seedRole(ds, { seed: 'otherB', platformId: PLATFORM_C, name: 'Manager', created: '2024-01-01T00:00:00Z' })
        await seedRole(ds, { seed: 'globalA', platformId: null, name: 'Viewer', created: '2024-01-01T00:00:00Z' })
        await seedRole(ds, { seed: 'globalB', platformId: null, name: 'viewer', created: '2024-01-02T00:00:00Z' })

        await runMigration(ds)

        expect(await nameOf(ds, 'otherA')).toBe('Manager')
        expect(await nameOf(ds, 'otherB')).toBe('Manager')
        expect(await nameOf(ds, 'globalA')).toBe('Viewer')
        expect(await nameOf(ds, 'globalB')).toBe('viewer')
    })

    it('keeps the name on the copy with the most members, not the oldest', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup()

        await seedRole(ds, { seed: 'tieOld', platformId: mockPlatform.id, name: 'Manager', created: '2024-01-01T00:00:00Z' })
        await seedRole(ds, { seed: 'tieNew', platformId: mockPlatform.id, name: 'Manager', created: '2024-06-01T00:00:00Z' })

        const member = createMockProjectMember({
            projectId: mockProject.id,
            userId: mockOwner.id,
            platformId: mockPlatform.id,
            projectRoleId: id('tieNew'),
        })
        await ds.getRepository('project_member').save(member)

        await runMigration(ds)

        expect(await nameOf(ds, 'tieNew')).toBe('Manager')
        expect(await nameOf(ds, 'tieOld')).toBe('Manager (2)')
    })

    it('builds an index that then rejects a case variant on the same platform', async () => {
        await seedRole(ds, { seed: 'idxA', platformId: PLATFORM_A, name: 'Manager', created: '2024-01-01T00:00:00Z' })

        await runMigration(ds)

        await expect(
            seedRole(ds, { seed: 'idxB', platformId: PLATFORM_A, name: 'MANAGER', created: '2024-02-01T00:00:00Z' }),
        ).rejects.toThrow()
    })
})
