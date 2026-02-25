import { SecretManagerProviderId } from '@activepieces/ee-shared'
import { apAxios } from '@activepieces/server-shared'
import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { MockInstance } from 'vitest'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { secretManagerCache } from '../../../../src/app/ee/secret-managers/secret-manager-cache'
import { secretManagersService } from '../../../../src/app/ee/secret-managers/secret-managers.service'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser, createMockUserIdentity, mockAndSaveBasicSetup } from '../../../helpers/mocks'
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

describe('Secret Manager Cache', () => {

    describe('checkConnection caching', () => {
        it('should cache checkConnection result and not call provider again on second list', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            axiosRequestSpy.mockClear()

            // First list — triggers checkConnection
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            const callsAfterFirstList = axiosRequestSpy.mock.calls.length

            // Second list — should hit cache, no HTTP calls
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(axiosRequestSpy.mock.calls.length).toBe(callsAfterFirstList)

            secretManagerCache.clearByPlatform(mockPlatform.id)
        })

        it('should not cache when checkConnection fails', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            // Now make checkConnection fail for subsequent calls
            vaultMock.mockVaultLoginFailure()
            axiosRequestSpy.mockClear()

            // First list — checkConnection fails, should NOT be cached
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            const callsAfterFirstList = axiosRequestSpy.mock.calls.length
            expect(callsAfterFirstList).toBeGreaterThan(0)

            // Second list — not cached, should try again
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(axiosRequestSpy.mock.calls.length).toBe(callsAfterFirstList * 2)

            secretManagerCache.clearByPlatform(mockPlatform.id)
        })
    })

    describe('getSecret caching', () => {
        it('should cache getSecret result and not call provider on second resolveString', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultGetSecretSuccess({ 'my-api-key': 'super-secret-value' })

            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            axiosRequestSpy.mockClear()

            // First resolveString — calls provider
            await secretManagersService(mockLog).resolveString({
                key: '{{hashicorp:secret/data/keys/my-api-key}}',
                platformId: mockPlatform.id,
            })

            const callsAfterFirst = axiosRequestSpy.mock.calls.length
            expect(callsAfterFirst).toBeGreaterThan(0)

            // Second resolveString — should hit cache
            await secretManagersService(mockLog).resolveString({
                key: '{{hashicorp:secret/data/keys/my-api-key}}',
                platformId: mockPlatform.id,
            })

            expect(axiosRequestSpy.mock.calls.length).toBe(callsAfterFirst)

            secretManagerCache.clearByPlatform(mockPlatform.id)
        })
    })

    describe('Cache invalidation on connect / disconnect', () => {
        it('should clear cache on connect', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            // First connect + list to populate cache
            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            // Second connect — clears cache
            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            axiosRequestSpy.mockClear()

            // List after reconnect — cache was cleared, fresh checkConnection expected
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(axiosRequestSpy.mock.calls.length).toBeGreaterThan(0)

            secretManagerCache.clearByPlatform(mockPlatform.id)
        })

        it('should clear cache on disconnect', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            // Connect and list to populate cache
            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            // Disconnect — clears cache and config
            await app!.inject({
                method: 'DELETE',
                url: '/v1/secret-managers/disconnect?providerId=hashicorp',
                headers: { authorization: `Bearer ${testToken}` },
            })

            // Reconnect with fresh config
            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            axiosRequestSpy.mockClear()

            // List — cache was cleared by disconnect, fresh checkConnection expected
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(axiosRequestSpy.mock.calls.length).toBeGreaterThan(0)

            secretManagerCache.clearByPlatform(mockPlatform.id)
        })
    })

    describe('DELETE /v1/secret-managers/cache endpoint', () => {
        it('should return 204 and force fresh checkConnection on next list', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            vaultMock.mockVaultLoginSuccess()

            await app!.inject({
                method: 'POST',
                url: '/v1/secret-managers/connect',
                headers: { authorization: `Bearer ${testToken}` },
                body: { providerId: SecretManagerProviderId.HASHICORP, config: mockVaultConfig },
            })

            // Populate cache with first list
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            axiosRequestSpy.mockClear()

            // Clear cache via endpoint
            const cacheResponse = await app!.inject({
                method: 'DELETE',
                url: '/v1/secret-managers/cache',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(cacheResponse.statusCode).toBe(StatusCodes.NO_CONTENT)
            // DELETE /cache itself makes no HTTP calls to providers
            expect(axiosRequestSpy.mock.calls.length).toBe(0)

            // List again — cache cleared, fresh checkConnection expected
            await app!.inject({
                method: 'GET',
                url: '/v1/secret-managers',
                headers: { authorization: `Bearer ${testToken}` },
            })

            expect(axiosRequestSpy.mock.calls.length).toBeGreaterThan(0)
        })

        it('should require platform admin (non-admin returns 403)', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({
                plan: { secretManagersEnabled: true },
            })

            const nonAdminUserIdentity = createMockUserIdentity({ verified: true })
            await databaseConnection().getRepository('user_identity').save(nonAdminUserIdentity)

            const nonAdminUser = createMockUser({
                identityId: nonAdminUserIdentity.id,
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            })
            await databaseConnection().getRepository('user').save(nonAdminUser)

            const nonAdminToken = await generateMockToken({
                type: PrincipalType.USER,
                id: nonAdminUser.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app!.inject({
                method: 'DELETE',
                url: '/v1/secret-managers/cache',
                headers: { authorization: `Bearer ${nonAdminToken}` },
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
