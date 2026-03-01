import { apAxios } from '@activepieces/server-common'
import { AppConnectionScope, AppConnectionType, ErrorCode, PrincipalType, SecretManagerProviderId, UpsertGlobalConnectionRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { MockInstance } from 'vitest'
import { appConnectionService } from '../../../../src/app/app-connection/app-connection-service/app-connection-service'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { hashicorpProvider } from '../../../../src/app/ee/secret-managers/secret-manager-providers/hashicorp-provider'
import { secretManagersService } from '../../../../src/app/ee/secret-managers/secret-managers.service'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup, mockPieceMetadata } from '../../../helpers/mocks'
import {
    hashicorpMock,
    mockVaultConfig,
} from './hashicorp-mock'

let app: FastifyInstance | null = null
let axiosRequestSpy: MockInstance
let vaultMock: ReturnType<typeof hashicorpMock>
let mockLog: FastifyBaseLogger
beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    mockLog = app!.log!
}, 50000)

beforeEach(() => {
    axiosRequestSpy = vi.spyOn(apAxios, 'request')
    vaultMock = hashicorpMock(axiosRequestSpy)
})

afterEach(() => {
    axiosRequestSpy.mockRestore()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})



describe('Secret Managers API', () => {

    describe('List Secret Managers', () => {
        it('should list available secret manager providers', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.data.length).toBeGreaterThan(0)
            const hashicorp = body.data.find((p: { id: string }) => p.id === SecretManagerProviderId.HASHICORP)
            expect(hashicorp).toBeDefined()
            expect(hashicorp.name).toBe('Hashicorp Vault')
            expect(hashicorp.connected).toBe(false)
        })

        it('should show connected status after connecting a provider', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            // Connect first
            await app?.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                },
            })

            // List and check connected status
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const hashicorp = body.data.find((p: { id: string }) => p.id === SecretManagerProviderId.HASHICORP)
            expect(hashicorp.connected).toBe(true)
        })
    })

    describe('Resolve Secret', () => {
        it('should resolve a secret from HashiCorp Vault', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            // Connect first
            await app?.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                },
            })

            vaultMock.mockVaultGetSecretSuccess({ 'my-api-key': 'super-secret-value' })
            const result = await secretManagersService(mockLog).resolveString({
                key: '{{hashicorp:secret/data/keys/my-api-key}}',
                platformId: mockPlatform.id,
            })

            expect(result).toBe('super-secret-value')
        })

        it('should throw error for non-secret key format', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })
            await expect(
                secretManagersService(mockLog).resolveString({
                    key: 'plain-text-value',
                    platformId: mockPlatform.id,
                }),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
                }),
            })
        })

        it('should throw error for invalid provider id', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })

            await expect(
                secretManagersService(mockLog).resolveString({
                    key: '{{invalid-provider:secret/data/keys/my-key}}',
                    platformId: mockPlatform.id,
                }),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.SECRET_MANAGER_KEY_NOT_SECRET,
                }),
            })
        })

        it('should throw error when secret is not found', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            await app?.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                },
            })

            vaultMock.mockVaultGetSecretNotFound()

            await expect(
                secretManagersService(mockLog).resolveString({
                    key: '{{hashicorp:secret/data/keys/nonexistent}}',
                    platformId: mockPlatform.id,
                }),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                }),
            })
        }),
        it('should not allow persisting resolved secrets in the database', async () => {
            const pieceMetadata = await mockPieceMetadata(mockLog)
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                    globalConnectionsEnabled: true,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            // Connect first
            await app?.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                },
            })
            const secretValue = 'super-secret-value'
            const secretKey = 'my-api-key'
            const secretPath = `{{hashicorp:secret/data/keys/${secretKey}}}`
            vaultMock.mockVaultGetSecretSuccess({ [secretKey]: secretValue })
            const mockUpsertAppConnectionRequest: UpsertGlobalConnectionRequestBody = {
                externalId: 'test-app-connection-with-metadata',
                displayName: 'Test Connection with Metadata',
                pieceName: pieceMetadata.name,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: secretPath,
                },
                metadata: {
                    foo: 'bar',
                },
                pieceVersion: pieceMetadata.version,
                projectIds: [mockProject.id],
                scope: AppConnectionScope.PLATFORM,
            }

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/global-connections',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: mockUpsertAppConnectionRequest,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
    
            const connection = await appConnectionService(mockLog).getOne({
                projectId: mockProject.id,
                platformId: mockPlatform.id,
                externalId: 'test-app-connection-with-metadata',
            })
            // make sure secrets are never stored in the database
            expect(connection?.value).toEqual({
                type: AppConnectionType.SECRET_TEXT,
                secret_text: secretPath,
            })
        }),
        describe('HashiCorp Provider - Path Resolution', () => {
            it('should resolve valid path format', async () => {
                await hashicorpProvider(mockLog).validatePathFormat('hashicorp:secret/data/keys/my-key')
            })
            it('should throw error for path with less than 3 parts', async () => {
                await expect(
                    hashicorpProvider(mockLog).validatePathFormat('secret/key'),
                ).rejects.toMatchObject({
                    error: expect.objectContaining({
                        code: ErrorCode.VALIDATION,
                    }),
                })
            })
            it('should throw error for key without colon separator', async () => {
                await expect(
                    hashicorpProvider(mockLog).validatePathFormat('hashicorp'),
                ).rejects.toMatchObject({
                    error: expect.objectContaining({
                        code: ErrorCode.VALIDATION,
                    }),
                })
            })
        })
    })
})
