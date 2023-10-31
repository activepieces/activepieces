import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { createMockUser, createMockPlatform, createMockSigningKey, generateMockExternalToken } from '../../../helpers/mocks'
// import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Managed Authentication API', () => {
    describe('External token endpoint', () => {
        it('Issues an access token', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
                generatedBy: mockUser.id,
            })
            await databaseConnection.getRepository('signing_key').save(mockSigningKey)

            const mockExternalToken = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.status).toBe('EXTERNAL')
            expect(responseBody?.token).toBeDefined()
        })
    })
})
