/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ErrorCode, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockApiKey,
    createMockProject,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('User projects API', () => {
    describe('GET /v1/users/projects?externalId=...', () => {
        it('lists projects visible to the target user when caller uses platform API key', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const memberExternalId = 'ext-user-for-project-list'
            const { mockUser: memberUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    externalId: memberExternalId,
                },
            })
            const memberPersonalProject = createMockProject({
                ownerId: memberUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
            })
            await db.save('project', memberPersonalProject)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/users/projects?externalId=${encodeURIComponent(memberExternalId)}`,
                headers: {
                    authorization: `Bearer ${apiKey.value}`,
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json() as { data: { id: string }[] }
            expect(body.data.some((p) => p.id === memberPersonalProject.id)).toBe(true)
        })

        it('returns forbidden when caller uses a user token', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const targetExternalId = 'ext-target-user'
            await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    externalId: targetExternalId,
                },
            })
            const { mockUser: otherMember } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const memberToken = await generateMockToken({
                type: PrincipalType.USER,
                id: otherMember.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/users/projects?externalId=${encodeURIComponent(targetExternalId)}`,
                headers: {
                    authorization: `Bearer ${memberToken}`,
                },
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('returns entity not found when external user id does not exist', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app!.inject({
                method: 'GET',
                url: '/api/v1/users/projects?externalId=non-existent-external-id',
                headers: {
                    authorization: `Bearer ${apiKey.value}`,
                },
            })

            expect(response.statusCode).toBe(StatusCodes.NOT_FOUND)
            const body = response.json() as { code: string }
            expect(body.code).toBe(ErrorCode.ENTITY_NOT_FOUND)
        })

        it('returns only projects matching the displayName filter', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const memberExternalId = 'ext-user-displayname-filter'
            const { mockUser: memberUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                    externalId: memberExternalId,
                },
            })
            const matchingProject = createMockProject({
                ownerId: memberUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.PERSONAL,
                displayName: 'alpha-project',
            })
            const otherProject = createMockProject({
                ownerId: memberUser.id,
                platformId: mockPlatform.id,
                type: ProjectType.TEAM,
                displayName: 'beta-project',
            })
            await db.save('project', matchingProject)
            await db.save('project', otherProject)

            const apiKey = createMockApiKey({ platformId: mockPlatform.id })
            await db.save('api_key', apiKey)

            const response = await app!.inject({
                method: 'GET',
                url: `/api/v1/users/projects?externalId=${encodeURIComponent(memberExternalId)}&displayName=alpha-project`,
                headers: {
                    authorization: `Bearer ${apiKey.value}`,
                },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json() as { data: { id: string }[] }
            expect(body.data.some((p) => p.id === matchingProject.id)).toBe(true)
            expect(body.data.some((p) => p.id === otherProject.id)).toBe(false)
        })
    })
})
