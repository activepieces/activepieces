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

describe('Governing platform', () => {
    it('is nothing on community', async () => {
        const { mockUserIdentity } = await mockAndSaveBasicSetup({ userIdentity: { email: 'owner@community.example.com' } })
        await expect(authenticationService(mockLog).findGoverningPlatform({ email: mockUserIdentity.email })).resolves.toBeNull()
    })
})
