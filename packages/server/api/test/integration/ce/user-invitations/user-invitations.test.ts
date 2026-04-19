import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
    InvitationType,
    PlatformRole,
    PrincipalType,
    ProjectRole,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    emailService(mockLog).sendInvitation = vi.fn()
})

describe('User Invitation API (CE)', () => {
    describe('Invite User', () => {
        it('should invite user to team project', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const ownerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const adminRole = await db.findOneByOrFail<ProjectRole>('project_role', {
                name: DefaultProjectRole.ADMIN,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/user-invitations',
                headers: { authorization: `Bearer ${ownerToken}` },
                body: {
                    projectRole: adminRole.name,
                    email: faker.internet.email(),
                    projectId: mockProject.id,
                    type: InvitationType.PROJECT,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
        })
    })
})
