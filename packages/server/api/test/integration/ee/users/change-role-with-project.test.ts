import { DefaultProjectRole, InvitationType, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Changing an Operator to Member with a project', () => {
    it('adds them to the project first, then changes the role, leaving a Member of that project', async () => {
        const { platformId, projectId, ownerToken } = await setup()
        const { mockUser: operator, mockUserIdentity } = await mockBasicUser({ user: { platformId, platformRole: PlatformRole.OPERATOR } })

        const added = await app?.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${ownerToken}` },
            body: { email: mockUserIdentity.email, type: InvitationType.PROJECT, projectId, projectRole: DefaultProjectRole.VIEWER },
        })
        const changed = await app?.inject({
            method: 'POST',
            url: `/api/v1/users/${operator.id}`,
            headers: { authorization: `Bearer ${ownerToken}` },
            body: { platformRole: PlatformRole.MEMBER },
        })

        expect(added?.statusCode).toBe(StatusCodes.CREATED)
        expect(changed?.statusCode).toBe(StatusCodes.OK)
        expect(changed?.json().platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: operator.id })).toStrictEqual({ [projectId]: DefaultProjectRole.VIEWER })
    })
})

async function setup() {
    const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled: true },
        project: { type: ProjectType.TEAM },
    })
    const ownerToken = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
    return { platformId: mockPlatform.id, projectId: mockProject.id, ownerToken }
}

async function roleNamesByProject({ userId }: { userId: string }): Promise<Record<string, string>> {
    const rows: { projectId: string, name: string }[] = await databaseConnection().query(
        'SELECT pm."projectId", pr."name" FROM "project_member" pm JOIN "project_role" pr ON pr."id" = pm."projectRoleId" WHERE pm."userId" = $1',
        [userId],
    )
    return Object.fromEntries(rows.map((row) => [row.projectId, row.name]))
}
