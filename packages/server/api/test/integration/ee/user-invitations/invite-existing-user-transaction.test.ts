import { apId } from '@activepieces/core-utils'
import { DefaultProjectRole, InvitationStatus, InvitationType, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ObjectLiteral, Repository } from 'typeorm'
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

describe('Inviting someone who is already on the platform', () => {
    it('leaves the platform invite with its project when the project invite fails', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({ plan: { projectRolesEnabled: true }, project: { type: ProjectType.TEAM } })
        const ownerToken = await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } })
        const email = faker.internet.email().toLowerCase()
        await mockBasicUser({ userIdentity: { email }, user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER } })
        const viewerRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.VIEWER })
        await databaseConnection().getRepository('user_invitation').save({
            id: apId(),
            email,
            type: InvitationType.PLATFORM,
            platformRole: PlatformRole.MEMBER,
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            projectRoleId: viewerRole.id,
            status: InvitationStatus.PENDING,
        })
        const originalUpsert = Repository.prototype.upsert
        const upsert = vi.spyOn(Repository.prototype, 'upsert').mockImplementation(function (this: Repository<ObjectLiteral>, ...args: Parameters<Repository<ObjectLiteral>['upsert']>) {
            if (this.metadata.tableName === 'user_invitation') {
                return Promise.reject(new Error('upsert failed'))
            }
            return originalUpsert.apply(this, args)
        })

        const response = await app?.inject({
            method: 'POST',
            url: '/api/v1/user-invitations',
            headers: { authorization: `Bearer ${ownerToken}` },
            body: { email, type: InvitationType.PROJECT, projectId: mockProject.id, projectRole: DefaultProjectRole.EDITOR },
        })
        upsert.mockRestore()

        expect(response?.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
        const invitations = await databaseConnection().getRepository('user_invitation').findBy({ email, platformId: mockPlatform.id })
        expect(invitations.map((invitation) => ({ type: invitation.type, projectId: invitation.projectId }))).toStrictEqual([
            { type: InvitationType.PLATFORM, projectId: mockProject.id },
        ])
    })
})
