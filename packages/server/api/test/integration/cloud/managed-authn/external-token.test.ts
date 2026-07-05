import { apId, ProjectRole } from '@activepieces/core-utils'
import { DefaultProjectRole, PiecesFilterType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { Redis } from 'ioredis'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { getProjectConcurrencyPoolKey } from '../../../../src/app/database/redis/keys'
import { distributedStore, redisConnections } from '../../../../src/app/database/redis-connections'
import { generateMockExternalToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockPieceTag,
    createMockProject,
    createMockSigningKey,
    createMockTag,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

async function deleteKeysByPattern(redis: Redis, pattern: string): Promise<void> {
    const stream = redis.scanStream({ match: pattern, count: 100 })
    for await (const keys of stream) {
        if (keys.length > 0) await redis.del(...keys)
    }
}

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    const redis = await redisConnections.useExisting()
    await deleteKeysByPattern(redis, 'concurrency-pool:limit:*')
    await deleteKeysByPattern(redis, 'project:concurrency-pool:*')
})
describe('Managed Authentication API', () => {
    describe('External token endpoint', () => {
        it('Signs up new users', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.firstName).toBe(mockExternalTokenPayload.firstName)
            expect(responseBody?.lastName).toBe(mockExternalTokenPayload.lastName)
            expect(responseBody?.trackEvents).toBe(true)
            expect(responseBody?.newsLetter).toBe(false)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.externalId).toBe(
                mockExternalTokenPayload.externalUserId,
            )
            expect(responseBody?.platformId).toBe(mockPlatform.id)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })

        it('Creates new project', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } =
                generateMockExternalToken({
                    platformId: mockPlatform.id,
                    signingKeyId: mockSigningKey.id,
                })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const generatedProject = await db.findOneBy('project', {
                id: responseBody?.projectId,
            })

            expect(generatedProject?.displayName).toBe(
                mockExternalTokenPayload.externalProjectId,
            )
            expect(generatedProject?.ownerId).toBe(mockPlatform.ownerId)
            expect(generatedProject?.platformId).toBe(mockPlatform.id)
            expect(generatedProject?.externalId).toBe(
                mockExternalTokenPayload.externalProjectId,
            )
        })

        it('Assigns the named piece set matching the first tag when exchanging external token', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: { managePiecesEnabled: true },
            })

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            // A tag maps to a named piece set (externalId = tag name), created by the backfill migration.
            const tagSet = {
                id: apId(),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                platformId: mockPlatform.id,
                name: 'free',
                externalId: 'free',
                isDefault: false,
                generatedForProjectId: null,
                config: { pieces: { mode: 'exclude_all', exceptions: ['@ap/a'] }, selectedActions: {}, selectedTriggers: {} },
            }
            await db.save('piece_set', tagSet)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                pieces: {
                    filterType: PiecesFilterType.ALLOWED,
                    // Only the first tag is honored; the second is ignored.
                    tags: ['free', 'ignored-second-tag'],
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const project = await db.findOneBy<{ pieceSetId: string }>('project', { id: responseBody?.projectId })
            expect(project?.pieceSetId).toBe(tagSet.id)
        })

        it('Upserts the legacy tag-based project plan when managePiecesEnabled is false', async () => {
            // arrange — mocks default managePiecesEnabled to false
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const mockTag = createMockTag({ platformId: mockPlatform.id, name: 'free' })
            await db.save('tag', mockTag)
            const mockPieceTag = createMockPieceTag({
                platformId: mockPlatform.id,
                tagId: mockTag.id,
                pieceName: '@activepieces/piece-slack',
            })
            await db.save('piece_tag', mockPieceTag)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                pieces: {
                    filterType: PiecesFilterType.ALLOWED,
                    tags: ['free'],
                },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const projectPlan = await db.findOneBy<{ pieces: string[], piecesFilterType: string }>('project_plan', { projectId: responseBody?.projectId })
            expect(projectPlan?.piecesFilterType).toBe(PiecesFilterType.ALLOWED)
            expect(projectPlan?.pieces).toEqual(['@activepieces/piece-slack'])

            const project = await db.findOneBy<{ pieceSetId: string | null }>('project', { id: responseBody?.projectId })
            expect(project?.pieceSetId).toBeNull()
        })

        it('Adds new user as a member in new project', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)


            const projectRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                projectRole: projectRole.name,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const generatedProjectMember = await db.findOneBy('project_member', {
                projectId: responseBody?.projectId,
                userId: responseBody?.id,
            })

            expect(generatedProjectMember?.projectId).toBe(responseBody?.projectId)
            expect(generatedProjectMember?.userId).toBe(responseBody?.id)
            expect(generatedProjectMember?.platformId).toBe(mockPlatform.id)
            expect(generatedProjectMember?.projectRoleId).toBe(projectRole.id)
        })

        it('Adds new user to existing project', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const mockExternalProjectId = apId()

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                externalId: mockExternalProjectId,
            })
            await db.save('project', mockProject)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                externalProjectId: mockExternalProjectId,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.projectId).toBe(mockProject.id)
        })

        it('Signs in existing users', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            const { mockUser } = await mockBasicUser({
                user: {
                    externalId: mockExternalTokenPayload.externalUserId,
                    platformId: mockPlatform.id,
                },
            })

            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
                externalId: mockExternalTokenPayload.externalProjectId,
            })
            await db.save('project', mockProject)

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.id).toBe(mockUser.id)
        })

        it('Fails if signing key is not found', async () => {
            // arrange
            await mockAndSaveBasicSetup()

            const nonExistentSigningKeyId = apId()

            const { mockExternalToken } = generateMockExternalToken({
                signingKeyId: nonExistentSigningKeyId,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
            expect(responseBody?.params?.message).toBe(
                `signing key not found signingKeyId=${nonExistentSigningKeyId}`,
            )
        })
    })

    describe('Concurrency pool', () => {
        it('Creates pool and assigns to project when token has concurrencyPoolKey and limit', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                concurrencyPoolKey: 'my-pool',
                concurrencyPoolLimit: 10,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ platformId: mockPlatform.id, key: 'my-pool' }) as { id: string, maxConcurrentJobs: number } | null

            expect(pool).not.toBeNull()
            expect(pool!.maxConcurrentJobs).toBe(10)

            const project = await db.findOneByOrFail<{ poolId: string | null }>('project', { id: responseBody?.projectId })
            expect(project.poolId).toBe(pool!.id)

            const cachedPoolId = await distributedStore.get<string>(getProjectConcurrencyPoolKey(responseBody?.projectId))
            expect(cachedPoolId).toBe(pool!.id)
        })

        it('Does not create pool when token has concurrencyPoolKey but no concurrencyPoolLimit', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                concurrencyPoolKey: 'no-limit-pool',
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const pool = await databaseConnection()
                .getRepository('concurrency_pool')
                .findOneBy({ platformId: mockPlatform.id, key: 'no-limit-pool' }) as { id: string, maxConcurrentJobs: number } | null

            expect(pool).toBeNull()

            const project = await db.findOneByOrFail<{ poolId: string | null }>('project', { id: responseBody?.projectId })
            expect(project.poolId).toBeNull()
        })

        it('Reuses same pool for same concurrencyPoolKey across multiple tokens', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken: token1 } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                externalProjectId: apId(),
                concurrencyPoolKey: 'shared-pool',
                concurrencyPoolLimit: 5,
            })

            const { mockExternalToken: token2 } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                externalProjectId: apId(),
                concurrencyPoolKey: 'shared-pool',
                concurrencyPoolLimit: 5,
            })

            const response1 = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: { externalAccessToken: token1 },
            })

            const response2 = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: { externalAccessToken: token2 },
            })

            const body1 = response1?.json()
            const body2 = response2?.json()
            expect(response1?.statusCode).toBe(StatusCodes.OK)
            expect(response2?.statusCode).toBe(StatusCodes.OK)

            const project1 = await db.findOneByOrFail<{ poolId: string | null }>('project', { id: body1?.projectId })
            const project2 = await db.findOneByOrFail<{ poolId: string | null }>('project', { id: body2?.projectId })

            expect(project1.poolId).toBe(project2.poolId)

            const poolCount = await databaseConnection()
                .getRepository('concurrency_pool')
                .countBy({ platformId: mockPlatform.id, key: 'shared-pool' })

            expect(poolCount).toBe(1)
        })

        it('Does not create pool when token has no concurrencyPoolKey', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await db.save('signing_key', mockSigningKey)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const project = await db.findOneByOrFail<{ poolId: string | null }>('project', { id: responseBody?.projectId })
            expect(project.poolId).toBeNull()
        })
    })
})
