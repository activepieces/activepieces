import { ErrorCode } from '@activepieces/core-utils'
import { DefaultProjectRole, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProject, createMockProjectMember, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Changing a role and adding a project in one request', () => {
    it('makes an Operator a Member of the picked project with the picked role', async () => {
        const { platformId, projectId, ownerToken } = await setup({ projectRolesEnabled: true })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })

        const response = await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.VIEWER } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().platformRole).toBe(PlatformRole.MEMBER)
        expect(await roleNamesByProject({ userId: operator.id })).toStrictEqual({ [projectId]: DefaultProjectRole.VIEWER })
    })

    it('changes their role in the project when they are already in it', async () => {
        const { platformId, projectId, ownerToken } = await setup({ projectRolesEnabled: true })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })
        const editor = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.EDITOR })
        await databaseConnection().getRepository('project_member').save(createMockProjectMember({ platformId, projectId, userId: operator.id, projectRoleId: editor.id }))

        await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.VIEWER } })

        expect(await roleNamesByProject({ userId: operator.id })).toStrictEqual({ [projectId]: DefaultProjectRole.VIEWER })
    })

    it('still changes a role without a project', async () => {
        const { platformId, ownerToken } = await setup({ projectRolesEnabled: true })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })

        const response = await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER } })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(await roleNamesByProject({ userId: operator.id })).toStrictEqual({})
    })

    it('refuses a project without a role, and keeps the old role', async () => {
        const { platformId, projectId, ownerToken } = await setup({ projectRolesEnabled: true })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })

        const response = await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER, projectId } })

        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
        expect(await platformRoleOf({ userId: operator.id })).toBe(PlatformRole.OPERATOR)
    })

    it('refuses a personal project, and keeps the old role', async () => {
        const { platformId, ownerToken } = await setup({ projectRolesEnabled: true })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })
        const personal = createMockProject({ platformId, ownerId: operator.id, type: ProjectType.PERSONAL })
        await databaseConnection().getRepository('project').save(personal)

        const response = await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER, projectId: personal.id, projectRole: DefaultProjectRole.EDITOR } })

        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
        expect(await platformRoleOf({ userId: operator.id })).toBe(PlatformRole.OPERATOR)
    })

    it('refuses another platform\'s project', async () => {
        const { platformId, ownerToken } = await setup({ projectRolesEnabled: true })
        const other = await setup({ projectRolesEnabled: true })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })

        const response = await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER, projectId: other.projectId, projectRole: DefaultProjectRole.EDITOR } })

        expect(response?.json().code).toBe(ErrorCode.VALIDATION)
        expect(await platformRoleOf({ userId: operator.id })).toBe(PlatformRole.OPERATOR)
    })

    it('refuses a project on a plan without project roles, and keeps the old role', async () => {
        const { platformId, projectId, ownerToken } = await setup({ projectRolesEnabled: false })
        const operator = await saveUser({ platformId, platformRole: PlatformRole.OPERATOR })

        const response = await changeRole({ token: ownerToken, userId: operator.id, body: { platformRole: PlatformRole.MEMBER, projectId, projectRole: DefaultProjectRole.EDITOR } })

        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(await platformRoleOf({ userId: operator.id })).toBe(PlatformRole.OPERATOR)
    })
})

async function setup({ projectRolesEnabled }: { projectRolesEnabled: boolean }) {
    const { mockPlatform, mockOwner, mockProject } = await mockAndSaveBasicSetup({
        plan: { projectRolesEnabled },
        project: { type: ProjectType.TEAM },
    })
    const ownerToken = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
    return { platformId: mockPlatform.id, projectId: mockProject.id, ownerToken }
}

async function saveUser({ platformId, platformRole }: { platformId: string, platformRole: PlatformRole }) {
    const { mockUser } = await mockBasicUser({ user: { platformId, platformRole } })
    return mockUser
}

async function changeRole({ token, userId, body }: { token: string, userId: string, body: Record<string, unknown> }) {
    return app?.inject({ method: 'POST', url: `/api/v1/users/${userId}`, headers: { authorization: `Bearer ${token}` }, body })
}

async function platformRoleOf({ userId }: { userId: string }) {
    const user = await databaseConnection().getRepository('user').findOneByOrFail({ id: userId })
    return user.platformRole
}

async function roleNamesByProject({ userId }: { userId: string }): Promise<Record<string, string>> {
    const rows: { projectId: string, name: string }[] = await databaseConnection().query(
        'SELECT pm."projectId", pr."name" FROM "project_member" pm JOIN "project_role" pr ON pr."id" = pm."projectRoleId" WHERE pm."userId" = $1',
        [userId],
    )
    return Object.fromEntries(rows.map((row) => [row.projectId, row.name]))
}
