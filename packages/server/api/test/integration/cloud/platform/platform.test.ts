import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apId, ApEdition, FileCompression, FileLocation, FileType, FilteredPieceBehavior,
    FlowOperationStatus,
    FlowStatus,
    PlanName,
    PlatformRole,
    PrincipalType,
    UpdatePlatformRequestBody,
    UserIdentityProvider,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { system } from '../../../../src/app/helper/system/system'
import { systemJobsQueue } from '../../../../src/app/helper/system-jobs/system-job'
import { db } from '../../../helpers/db'
import { generateMockToken } from '../../../helpers/auth'
import { checkIfSolutionExistsInDb, createMockConnection, createMockFile, createMockFlow, createMockFlowRun, createMockFlowVersion, createMockSolutionAndSave, createMockUser, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

async function waitForDeletionJobs(jobIds: string[], timeoutMs = 60000) {
    const start = Date.now()
    for (const jobId of jobIds) {
        while (Date.now() - start < timeoutMs) {
            const job = await systemJobsQueue?.getJob(jobId)
            if (!job) break
            const state = await job.getState()
            if (state === 'completed') break
            if (state === 'failed' && (job.attemptsMade ?? 0) >= (job.opts?.attempts ?? 2)) {
                throw new Error(`Job ${jobId} failed: ${job.failedReason}`)
            }
            if (state === 'delayed') {
                await job.promote()
            }
            await new Promise(r => setTimeout(r, 200))
        }
    }
    if (Date.now() - start >= timeoutMs) {
        throw new Error(`Deletion jobs timed out after ${timeoutMs}ms`)
    }
}

function deletionJobIds(platformId: string, projectIds: string[]) {
    return [
        ...projectIds.map((id) => `hard-delete-project-${id}`),
        `hard-delete-platform-${platformId}`,
    ]
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Platform API', () => {
    describe('update platform endpoint', () => {
        it('patches a platform by id', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    embeddingEnabled: false,
                },
                platform: {
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            const requestBody: UpdatePlatformRequestBody = {
                name: 'updated name',
                primaryColor: 'updated primary color',
                filteredPieceNames: ['updated filtered piece names'],
                filteredPieceBehavior: FilteredPieceBehavior.ALLOWED,
                enforceAllowedAuthDomains: true,
                allowedAuthDomains: ['yahoo.com'],
                cloudAuthEnabled: false,
                emailAuthEnabled: false,
            }
            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: requestBody,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.enforceAllowedAuthDomains).toBe(
                requestBody.enforceAllowedAuthDomains,
            )
            expect(responseBody.allowedAuthDomains).toEqual(
                requestBody.allowedAuthDomains,
            )
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.emailAuthEnabled).toBe(requestBody.emailAuthEnabled)
            expect(responseBody.name).toBe('updated name')
            expect(responseBody.primaryColor).toBe('updated primary color')
            expect(responseBody.filteredPieceNames).toStrictEqual([
                'updated filtered piece names',
            ])
            expect(responseBody.filteredPieceBehavior).toBe('ALLOWED')
            expect(responseBody.emailAuthEnabled).toBe(false)
            expect(responseBody.federatedAuthProviders).toStrictEqual({
                google: null,
                github: null,
                saml: null,
            })
            expect(responseBody.cloudAuthEnabled).toBe(false)
        }),

        it('updates the platform logo icons', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    embeddingEnabled: false,
                },
                platform: {
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            const formData = new FormData()
            formData.append('logoIcon', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('fullLogo', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('favIcon', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('name', 'updated name')
            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: formData,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.name).toBe('updated name')

            const baseUrl = 'http://localhost:4200/api/v1/platforms/assets'
            expect(responseBody.logoIconUrl.startsWith(baseUrl)).toBeTruthy()
            expect(responseBody.fullLogoUrl.startsWith(baseUrl)).toBeTruthy()
            expect(responseBody.favIconUrl.startsWith(baseUrl)).toBeTruthy()
        }),

        it('updates platform with boolean and array fields via multipart form data', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    embeddingEnabled: false,
                },
                platform: {
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })
            const formData = new FormData()
            formData.append('logoIcon', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('fullLogo', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('favIcon', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('cloudAuthEnabled', 'false')
            formData.append('emailAuthEnabled', 'false')
            formData.append('enforceAllowedAuthDomains', 'true')
            formData.append('filteredPieceNames', 'piece-1')
            formData.append('allowedAuthDomains', 'example.com')
            formData.append('pinnedPieces', 'pinned-1')
            formData.append('name', 'updated name')
            formData.append('filteredPieceBehavior', 'ALLOWED')

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: formData,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.cloudAuthEnabled).toBe(false)
            expect(responseBody.emailAuthEnabled).toBe(false)
            expect(responseBody.enforceAllowedAuthDomains).toBe(true)
            expect(responseBody.filteredPieceNames).toStrictEqual(['piece-1'])
            expect(responseBody.allowedAuthDomains).toStrictEqual(['example.com'])
            expect(responseBody.pinnedPieces).toStrictEqual(['pinned-1'])
            expect(responseBody.name).toBe('updated name')
            expect(responseBody.filteredPieceBehavior).toBe('ALLOWED')

            const baseUrl = 'http://localhost:4200/api/v1/platforms/assets'
            expect(responseBody.logoIconUrl.startsWith(baseUrl)).toBeTruthy()
            expect(responseBody.fullLogoUrl.startsWith(baseUrl)).toBeTruthy()
            expect(responseBody.favIconUrl.startsWith(baseUrl)).toBeTruthy()
        }),

        it('fails if user is not owner', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                
                platform: { id: mockPlatform.id },
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    primaryColor: '#000000',
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('rejects cross-tenant platform update (IDOR)', async () => {
            // arrange — two independent platforms with their own admin owners
            const { mockOwner: ownerOfPlatformA, mockPlatform: platformA } = await mockAndSaveBasicSetup()
            const { mockOwner: ownerOfPlatformB, mockPlatform: platformB } = await mockAndSaveBasicSetup({
                platform: { name: 'platform-b-original-name' },
            })

            const attackerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: ownerOfPlatformA.id,
                platform: { id: platformA.id },
            })

            // act — attacker (admin of platform A) points the write at platform B
            const attackResponse = await app?.inject({
                method: 'POST',
                url: `/api/v1/platforms/${platformB.id}`,
                headers: { authorization: `Bearer ${attackerToken}` },
                body: { name: 'pwned' },
            })

            // assert — request is rejected
            expect(attackResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)

            // assert — platform B was NOT mutated (defense-in-depth check)
            const victimToken = await generateMockToken({
                type: PrincipalType.USER,
                id: ownerOfPlatformB.id,
                platform: { id: platformB.id },
            })
            const victimReadResponse = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/${platformB.id}`,
                headers: { authorization: `Bearer ${victimToken}` },
            })
            expect(victimReadResponse?.statusCode).toBe(StatusCodes.OK)
            expect(victimReadResponse?.json().name).toBe('platform-b-original-name')
        })

    })

    describe('get platform endpoint', () => {
        it('Always Returns non-sensitive information for platform', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    federatedAuthProviders: {
                        google: {
                            clientId: faker.internet.password(),
                            clientSecret: faker.internet.password(),
                        },
                        saml: {
                            idpCertificate: faker.internet.password(),
                            idpMetadata: faker.internet.password(),
                        },
                    },
                },
            })

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            expect(Object.keys(responseBody).length).toBe(21)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.name).toBe(mockPlatform.name)
            expect(responseBody.federatedAuthProviders.google).toStrictEqual({
                clientId: mockPlatform.federatedAuthProviders?.google?.clientId,
            })
            expect(responseBody.federatedAuthProviders.saml).toStrictEqual({})
            expect(responseBody.primaryColor).toBe(mockPlatform.primaryColor)
            expect(responseBody.logoIconUrl).toBe(mockPlatform.logoIconUrl)
            expect(responseBody.fullLogoUrl).toBe(mockPlatform.fullLogoUrl)
            expect(responseBody.favIconUrl).toBe(mockPlatform.favIconUrl)
        })


        it('Hides license key from JWT provider (embedded) users', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    licenseKey: 'test-license-key',
                },
            })

            const { mockUser: embeddedUser } = await mockBasicUser({
                userIdentity: {
                    provider: UserIdentityProvider.JWT,
                },
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: embeddedUser.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.plan.licenseKey).toBeNull()
        })

        it('Returns license key for non-embedded users', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    licenseKey: 'test-license-key',
                },
            })

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.plan.licenseKey).toBe('test-license-key')
        })

        it('Fails if user is not a platform member', async () => {
            const { mockOwner: mockOwner1, mockPlatform: mockPlatform1 } = await mockAndSaveBasicSetup()
            const { mockPlatform: mockPlatform2 } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner1.id,
                platform: {
                    id: mockPlatform1.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/${mockPlatform2.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    }),
    describe('delete platform endpoint', () => {
        const isCloud = system.getEdition() === ApEdition.CLOUD

        it('deletes a platform by id', async () => {
            if (!isCloud) return
            // arrange
            const firstAccount = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondAccount = await mockAndSaveBasicSetup(
                {
                    plan: {
                        plan: PlanName.STANDARD,
                    },
                },
            )

            const ownerSolution = await createMockSolutionAndSave({ projectId: firstAccount.mockProject.id, platformId: firstAccount.mockPlatform.id, userId: firstAccount.mockOwner.id })

            const secondSolution = await createMockSolutionAndSave({ projectId: secondAccount.mockProject.id, platformId: secondAccount.mockPlatform.id, userId: secondAccount.mockOwner.id })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: firstAccount.mockOwner.id,
                platform: { id: firstAccount.mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/platforms/${firstAccount.mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            await waitForDeletionJobs(deletionJobIds(firstAccount.mockPlatform.id, [firstAccount.mockProject.id]))
            const secondSolutionExists = await checkIfSolutionExistsInDb(secondSolution)
            expect(secondSolutionExists).toBe(true)
            const ownerSolutionExists = await checkIfSolutionExistsInDb(ownerSolution)
            expect(ownerSolutionExists).toBe(false)
        }),
        it('fails if platform is not eligible for deletion', async () => {
            if (!isCloud) return
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.ENTERPRISE,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,

                platform: { id: mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
        }),
        it('fails if user is not owner', async () => {
            if (!isCloud) return
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondAccount = await mockAndSaveBasicSetup(
                {
                    plan: {
                        plan: PlanName.STANDARD,
                    },
                },
            )
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,

                platform: { id: mockPlatform.id },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/platforms/${secondAccount.mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        }),
        it('deletes platform, project, user, and connections atomically', async () => {
            if (!isCloud) return

            const account = await mockAndSaveBasicSetup({
                plan: { plan: PlanName.STANDARD },
            })

            const connection = createMockConnection(
                { projectIds: [account.mockProject.id], platformId: account.mockPlatform.id },
                account.mockOwner.id,
            )
            await databaseConnection().getRepository('app_connection').save([connection])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: account.mockOwner.id,
                platform: { id: account.mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/platforms/${account.mockPlatform.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            await waitForDeletionJobs(deletionJobIds(account.mockPlatform.id, [account.mockProject.id]))

            const platform = await db.findOneBy('platform', { id: account.mockPlatform.id })
            expect(platform).toBeNull()

            const project = await db.findOneBy('project', { id: account.mockProject.id })
            expect(project).toBeNull()

            const user = await db.findOneBy('user', { id: account.mockOwner.id })
            expect(user).toBeNull()

            const savedConnection = await db.findOneBy('app_connection', { id: connection.id })
            expect(savedConnection).toBeNull()

            const identity = await db.findOneBy('user_identity', { id: account.mockUserIdentity.id })
            expect(identity).toBeNull()
        }),

        it('deletes enabled flows and their related data', async () => {
            if (!isCloud) return

            const account = await mockAndSaveBasicSetup({
                plan: { plan: PlanName.STANDARD },
            })

            const flowVersionId = apId()
            const enabledFlow = createMockFlow({
                projectId: account.mockProject.id,
                status: FlowStatus.ENABLED,
                publishedVersionId: null,
                operationStatus: FlowOperationStatus.NONE,
            })
            const flowVersion = createMockFlowVersion({
                id: flowVersionId,
                flowId: enabledFlow.id,
            })
            const flowRun = createMockFlowRun({
                projectId: account.mockProject.id,
                flowId: enabledFlow.id,
                flowVersionId: flowVersion.id,
            })

            await databaseConnection().getRepository('flow').save([enabledFlow])
            await databaseConnection().getRepository('flow_version').save([flowVersion])
            await databaseConnection().getRepository('flow').update(enabledFlow.id, { publishedVersionId: flowVersionId })
            await databaseConnection().getRepository('flow_run').save([flowRun])

            const disabledFlow = createMockFlow({
                projectId: account.mockProject.id,
                status: FlowStatus.DISABLED,
                operationStatus: FlowOperationStatus.NONE,
            })
            const disabledFlowVersion = createMockFlowVersion({ flowId: disabledFlow.id })
            await databaseConnection().getRepository('flow').save([disabledFlow])
            await databaseConnection().getRepository('flow_version').save([disabledFlowVersion])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: account.mockOwner.id,
                platform: { id: account.mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/platforms/${account.mockPlatform.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            await waitForDeletionJobs(deletionJobIds(account.mockPlatform.id, [account.mockProject.id]))

            const savedEnabledFlow = await db.findOneBy('flow', { id: enabledFlow.id })
            expect(savedEnabledFlow).toBeNull()

            const savedDisabledFlow = await db.findOneBy('flow', { id: disabledFlow.id })
            expect(savedDisabledFlow).toBeNull()

            const savedFlowVersion = await db.findOneBy('flow_version', { id: flowVersion.id })
            expect(savedFlowVersion).toBeNull()

            const savedFlowRun = await db.findOneBy('flow_run', { id: flowRun.id })
            expect(savedFlowRun).toBeNull()

            const platform = await db.findOneBy('platform', { id: account.mockPlatform.id })
            expect(platform).toBeNull()

            const project = await db.findOneBy('project', { id: account.mockProject.id })
            expect(project).toBeNull()
        }),

        it('doesn\'t delete user identity if it has other users', async () => {
            if (!isCloud) return
            // arrange
            const firstAccount = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondPlatform = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondUser = createMockUser({
                platformId: secondPlatform.mockPlatform.id,
                platformRole: PlatformRole.ADMIN,
                identityId: firstAccount.mockUserIdentity.id,
            })
            await db.save('user', secondUser)
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: firstAccount.mockOwner.id,
                platform: { id: firstAccount.mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/platforms/${firstAccount.mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            await waitForDeletionJobs(deletionJobIds(firstAccount.mockPlatform.id, [firstAccount.mockProject.id]))
            const userIdentityExists = await db.findOneBy('user_identity', { id: firstAccount.mockUserIdentity.id })
            expect(userIdentityExists).not.toBeNull()
        })
    })
    describe('get platform endpoint', () => {
        it('fails if user is not part of the platform', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/${apId()}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    }),
    it('succeeds if user is part of the platform and is not admin', async () => {
        // arrange
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const { mockUser } = await mockBasicUser({
            user: {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            },
        })
        await db.save('user', mockUser)
        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
            
            platform: { id: mockPlatform.id },
        })
        // act
        const response = await app?.inject({
            method: 'GET',
            url: `/api/v1/platforms/${mockPlatform.id}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })
        // assert
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })

    describe('get platform asset endpoint', () => {
        it('serves a public platform asset', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const assetData = Buffer.from('public-logo-bytes')
            const assetFile = createMockFile({
                platformId: mockPlatform.id,
                projectId: null,
                type: FileType.PLATFORM_ASSET,
                compression: FileCompression.NONE,
                location: FileLocation.DB,
                data: assetData,
                fileName: 'logo.png',
                metadata: { mimetype: 'image/png' },
            })
            await db.save('file', assetFile)

            // act — public endpoint, no auth
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/assets/${assetFile.id}`,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.headers['content-type']).toContain('image/png')
            expect(response?.rawPayload.equals(assetData)).toBe(true)
        })

        it('rejects access to non-PLATFORM_ASSET files (IDOR via public asset endpoint)', async () => {
            // arrange — a sensitive flow run log file stored under a project
            const { mockProject } = await mockAndSaveBasicSetup()
            const sensitiveData = Buffer.from(JSON.stringify({ secret: 'super-secret-api-key' }))
            const sensitiveFile = createMockFile({
                projectId: mockProject.id,
                type: FileType.FLOW_RUN_LOG,
                compression: FileCompression.NONE,
                location: FileLocation.DB,
                data: sensitiveData,
                fileName: 'flow-run.json',
                metadata: { mimetype: 'application/json' },
            })
            await db.save('file', sensitiveFile)

            // act — unauthenticated attacker hits the public asset endpoint
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/assets/${sensitiveFile.id}`,
            })

            // assert — non-asset file types must NOT be served by this endpoint
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
            expect(response?.rawPayload.includes(sensitiveData)).toBe(false)
        })

        it('returns 404 for unknown asset ids', async () => {
            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/platforms/assets/${apId()}`,
            })
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})