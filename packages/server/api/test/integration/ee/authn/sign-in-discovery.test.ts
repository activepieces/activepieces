import { SsoDomainVerificationRecordType, SsoDomainVerificationStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let mockLog: FastifyBaseLogger

beforeAll(async () => {
    const app = await setupTestEnvironment()
    mockLog = app.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Sign-in discovery', () => {
    it('returns domainOwned: false on self-hosted even for a verified domain', async () => {
        await mockAndSaveBasicSetup({
            platform: {
                ssoDomain: 'self-hosted.example.com',
                ssoDomainVerification: {
                    status: SsoDomainVerificationStatus.VERIFIED,
                    record: { type: SsoDomainVerificationRecordType.TXT, name: '_activepieces-verify.self-hosted.example.com', value: 'activepieces-verify=test' },
                    createdAt: new Date().toISOString(),
                },
            },
            plan: { ssoEnabled: true },
        })
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: 'self-hosted.example.com' })).resolves.toEqual({ domainOwned: false })
    })
})
