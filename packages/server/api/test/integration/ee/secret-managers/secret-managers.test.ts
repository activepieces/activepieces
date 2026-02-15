import { SecretManagerProviderId } from '@activepieces/ee-shared'
import { apAxios } from '@activepieces/server-shared'
import { ErrorCode, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import {
    hashicorpMock,
    mockVaultConfig,
} from './hashicorp-mock'

let app: FastifyInstance | null = null
let axiosRequestSpy: jest.SpyInstance
let vaultMock: ReturnType<typeof hashicorpMock>

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
}, 30000)

beforeEach(() => {
    axiosRequestSpy = jest.spyOn(apAxios, 'request')
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
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
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
            expect(Array.isArray(body)).toBe(true)
            expect(body.length).toBeGreaterThan(0)

            const hashicorp = body.find((p: { id: string }) => p.id === SecretManagerProviderId.HASHICORP)
            expect(hashicorp).toBeDefined()
            expect(hashicorp.name).toBe('Hashicorp Vault')
            expect(hashicorp.connected).toBe(false)
        })

        it('should show connected status after connecting a provider', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
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
            const hashicorp = body.find((p: { id: string }) => p.id === SecretManagerProviderId.HASHICORP)
            expect(hashicorp.connected).toBe(true)
        })
    })

    describe('Resolve Secret', () => {
        it('should resolve a secret from HashiCorp Vault', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
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

            const { secretManagersService } = await import('../../../../src/app/ee/secret-managers/secret-managers.service')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger
            const result = await secretManagersService(mockLog).resolve({
                key: '{{hashicorp:secret/data/keys/my-api-key}}',
                platformId: mockPlatform.id,
            })

            expect(result).toBe('super-secret-value')
        })

        it('should throw error for non-secret key format', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { secretManagersService } = await import('../../../../src/app/ee/secret-managers/secret-managers.service')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            await expect(
                secretManagersService(mockLog).resolve({
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
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { secretManagersService } = await import('../../../../src/app/ee/secret-managers/secret-managers.service')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            await expect(
                secretManagersService(mockLog).resolve({
                    key: '{{invalid-provider:secret/data/keys/my-key}}',
                    platformId: mockPlatform.id,
                }),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.VALIDATION,
                }),
            })
        })

        it('should throw error when secret is not found', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
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

            const { secretManagersService } = await import('../../../../src/app/ee/secret-managers/secret-managers.service')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            await expect(
                secretManagersService(mockLog).resolve({
                    key: '{{hashicorp:secret/data/keys/nonexistent}}',
                    platformId: mockPlatform.id,
                }),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.SECRET_MANAGER_GET_SECRET_FAILED,
                }),
            })
        })
    })

    describe('HashiCorp Provider - Path Resolution', () => {
        it('should resolve valid path format', async () => {
            const { hashicorpProvider } = await import('../../../../src/app/ee/secret-managers/secret-manager-providers/hashicorp-provider')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            const result = await hashicorpProvider(mockLog).resolve('hashicorp:secret/data/keys/my-key')
            expect(result).toEqual({ path: 'secret/data/keys/my-key' })
        })

        it('should remove trailing slash from path', async () => {
            const { hashicorpProvider } = await import('../../../../src/app/ee/secret-managers/secret-manager-providers/hashicorp-provider')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            const result = await hashicorpProvider(mockLog).resolve('hashicorp:secret/data/keys/my-key/')
            expect(result).toEqual({ path: 'secret/data/keys/my-key' })
        })

        it('should throw error for path with less than 3 parts', async () => {
            const { hashicorpProvider } = await import('../../../../src/app/ee/secret-managers/secret-manager-providers/hashicorp-provider')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            await expect(
                hashicorpProvider(mockLog).resolve('hashicorp:secret/key'),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.VALIDATION,
                }),
            })
        })

        it('should throw error for key without colon separator', async () => {
            const { hashicorpProvider } = await import('../../../../src/app/ee/secret-managers/secret-manager-providers/hashicorp-provider')
            const mockLog = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as import('fastify').FastifyBaseLogger

            await expect(
                hashicorpProvider(mockLog).resolve('hashicorp'),
            ).rejects.toMatchObject({
                error: expect.objectContaining({
                    code: ErrorCode.VALIDATION,
                }),
            })
        })
    })

    describe('Platform Isolation', () => {
        it('should not see secret managers from another platform', async () => {
            const { mockOwner: owner1, mockPlatform: platform1 } = await mockAndSaveBasicSetup()
            const { mockOwner: owner2, mockPlatform: platform2 } = await mockAndSaveBasicSetup()

            const token1 = await generateMockToken({
                type: PrincipalType.USER,
                id: owner1.id,
                platform: { id: platform1.id },
            })
            const token2 = await generateMockToken({
                type: PrincipalType.USER,
                id: owner2.id,
                platform: { id: platform2.id },
            })

            vaultMock.mockVaultLoginSuccess()

            // Connect on platform 1
            await app?.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: {
                    authorization: `Bearer ${token1}`,
                },
                body: {
                    providerId: SecretManagerProviderId.HASHICORP,
                    config: mockVaultConfig,
                },
            })

            // List on platform 2 - should not be connected
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: {
                    authorization: `Bearer ${token2}`,
                },
            })

            const body = response?.json()
            const hashicorp = body.find((p: { id: string }) => p.id === SecretManagerProviderId.HASHICORP)
            expect(hashicorp.connected).toBe(false)
        })
    })
})
