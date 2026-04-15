import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { apAxios } from '../../../../src/app/helper/ap-axios'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { MockInstance } from 'vitest'
import { appConnectionService } from '../../../../src/app/app-connection/app-connection-service/app-connection-service'
import { secretManagersService } from '../../../../src/app/ee/secret-managers/secret-managers.service'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup, mockPieceMetadata } from '../../../helpers/mocks'
import {
    hashicorpMock,
    mockVaultConfig,
} from './hashicorp-mock'
import { AppConnectionScope, AppConnectionType, ErrorCode, PrincipalType, SecretManagerConnectionScope, SecretManagerFieldsSeparator, SecretManagerProviderId, UpsertGlobalConnectionRequestBody } from '@activepieces/shared'
import { validatePathFormat } from 'packages/server/api/src/app/ee/secret-managers/secret-manager-providers/hashicorp-provider'

let app: FastifyInstance | null = null
let axiosRequestSpy: MockInstance
let vaultMock: ReturnType<typeof hashicorpMock>
let mockLog: FastifyBaseLogger
beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(() => {
    axiosRequestSpy = vi.spyOn(apAxios, 'request')
    vaultMock = hashicorpMock(axiosRequestSpy)
})

afterEach(() => {
    axiosRequestSpy.mockRestore()
})

async function createHashicorpConnection(app: FastifyInstance, testToken: string) {
    const response = await app.inject({
        method: 'POST',
        url: '/api/v1/secret-managers',
        headers: {
            authorization: `Bearer ${testToken}`,
        },
        body: {
            providerId: SecretManagerProviderId.HASHICORP,
            config: mockVaultConfig,
            name: 'test-vault',
            scope: SecretManagerConnectionScope.PLATFORM,
        },
    })
    return response.json<{ id: string }>()
}

describe('Secret Managers API', () => {

    describe('List Secret Manager Connections', () => {
        it('should return empty list when no connections configured', async () => {
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
                url: '/api/v1/secret-managers',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.data.length).toBe(0)
        })

        it('should list connections after creating one', async () => {
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
            await createHashicorpConnection(app!, testToken)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/secret-managers',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBe(1)
            const conn = body.data[0]
            expect(conn.name).toBe('test-vault')
            expect(conn.providerId).toBe(SecretManagerProviderId.HASHICORP)
            expect(conn.scope).toBe(SecretManagerConnectionScope.PLATFORM)
            expect(conn.connection.configured).toBe(true)
            expect(conn.connection.connected).toBe(true)
        })

        it('should allow multiple connections for the same provider', async () => {
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
            const first = await createHashicorpConnection(app!, testToken)

            vaultMock.mockVaultLoginSuccess()
            const second = await app!.inject({
                method: 'POST',
                url: '/api/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                    name: 'test-vault-2',
                    scope: SecretManagerConnectionScope.PLATFORM,
                },
            })
            expect(second.statusCode).toBe(StatusCodes.CREATED)
            expect(second.json().id).not.toBe(first.id)

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/api/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(listResponse?.json().data.length).toBe(2)
        })

        it('should filter project-scoped connections by projectId', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup({
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
            // Create platform-scoped connection
            await createHashicorpConnection(app!, testToken)

            vaultMock.mockVaultLoginSuccess()
            // Create project-scoped connection for mockProject
            await app!.inject({
                method: 'POST',
                url: '/api/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                    name: 'project-vault',
                    scope: SecretManagerConnectionScope.PROJECT,
                    projectIds: [mockProject.id],
                },
            })

            // Without projectId filter: should see both
            const allResponse = await app?.inject({
                method: 'GET',
                url: '/api/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(allResponse?.json().data.length).toBe(2)

            // With correct projectId filter: should see both (platform + project for this project)
            const filteredResponse = await app?.inject({
                method: 'GET',
                url: `/api/v1/secret-managers?projectId=${mockProject.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(filteredResponse?.json().data.length).toBe(2)

            // With different projectId: should see only the platform-scoped one
            const otherProjectResponse = await app?.inject({
                method: 'GET',
                url: '/api/v1/secret-managers?projectId=other-project-id',
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(otherProjectResponse?.json().data.length).toBe(1)
            expect(otherProjectResponse?.json().data[0].scope).toBe(SecretManagerConnectionScope.PLATFORM)
        })
    })

    describe('Delete Secret Manager Connection', () => {
        it('should delete a connection by id', async () => {
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
            const created = await createHashicorpConnection(app!, testToken)

            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/secret-managers/${created.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(deleteResponse?.statusCode).toBe(StatusCodes.NO_CONTENT)

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/api/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(listResponse?.json().data.length).toBe(0)
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
            const created = await createHashicorpConnection(app!, testToken)

            vaultMock.mockVaultGetSecretSuccess({ 'my-api-key': 'super-secret-value' })
            const result = await secretManagersService(mockLog).resolveString({
                key: `{{${created.id}${SecretManagerFieldsSeparator}secret/data/keys/my-api-key}}`,
                platformId: mockPlatform.id,
            })

            expect(result).toBe('super-secret-value')
        })

        it('should retrun original value for non-secret key format', async () => {
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
            ).resolves.toBe('plain-text-value')
        })

        it('should return original value for missing separator in secret key', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    secretManagersEnabled: true,
                },
            })

            await expect(
                secretManagersService(mockLog).resolveString({
                    key: '{{no-separator-here}}',
                    platformId: mockPlatform.id,
                    throwOnFailure: false,
                }),
            ).resolves.toBe('{{no-separator-here}}')
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
            const created = await createHashicorpConnection(app!, testToken)

            vaultMock.mockVaultGetSecretNotFound()

            await expect(
                secretManagersService(mockLog).resolveString({
                    key: `{{${created.id}${SecretManagerFieldsSeparator}secret/data/keys/nonexistent}}`,
                    platformId: mockPlatform.id,
                }),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                }),
            })
        })

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
            const created = await createHashicorpConnection(app!, testToken)

            const secretValue = 'super-secret-value'
            const secretKey = 'my-api-key'
            const secretPath = `{{${created.id}${SecretManagerFieldsSeparator}secret/data/keys/${secretKey}}}`
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
                url: '/api/v1/global-connections',
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
        })
    })

    describe('Clear Cache Endpoint', () => {
        it('should clear platform cache when no connectionId provided', async () => {
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
                method: 'DELETE',
                url: '/api/v1/secret-managers/cache',
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('should clear connection cache when connectionId is provided', async () => {
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
            const created = await createHashicorpConnection(app!, testToken)

            const response = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/secret-managers/cache?connectionId=${created.id}`,
                headers: { authorization: `Bearer ${testToken}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })
    })

    describe('HashiCorp Provider - Path Resolution', () => {
        it('should resolve valid path format', async () => {
            await validatePathFormat(`hashicorp${SecretManagerFieldsSeparator}secret/data/keys/my-key`)
        })
        it('should throw error for path with less than 3 parts', async () => {
            await expect(
                validatePathFormat('secret/key'),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.VALIDATION,
                }),
            })
        })
        it('should throw error for key without colon separator', async () => {
            await expect(
                validatePathFormat('hashicorp'),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.VALIDATION,
                }),
            })
        })
    })
})
