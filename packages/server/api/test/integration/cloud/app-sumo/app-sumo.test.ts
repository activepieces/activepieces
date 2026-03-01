import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { ApEdition } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { system } from '../../../../src/app/helper/system/system'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('AppSumo API', () => {
    describe('Action endpoint', () => {
        it('Activates new accounts', async () => {
            const edition = system.getEdition()
            if (edition !== ApEdition.CLOUD) {
                return
            }
            // arrange
            const mockEmail = 'mock-email'

            const requestBody = {
                action: 'activate',
                plan_id: 'plan_id',
                uuid: 'uuid',
                activation_email: mockEmail,
            }

            const appSumoToken = 'app-sumo-token'

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/appsumo/action',
                headers: {
                    authorization: `Bearer ${appSumoToken}`,
                },
                body: requestBody,
            })

            // assert
            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody?.message).toBe('success')
            expect(responseBody?.redirect_url).toBe(
                `https://cloud.activepieces.com/sign-up?email=${mockEmail}`,
            )
        })
    })
})
