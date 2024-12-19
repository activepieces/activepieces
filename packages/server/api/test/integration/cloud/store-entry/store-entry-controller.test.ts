import { apId, PrincipalType, User } from '@activepieces/shared'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockPlatform, createMockProject, createMockUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Store-entries API', () => {
    const projectId = apId()
    let engineToken: string
    let userToken: string
    let serviceToken: string
    let mockUser: User

    beforeEach(async () => {
        mockUser = createMockUser()
        await databaseConnection().getRepository('user').save(mockUser)

        const mockPlatform = createMockPlatform({
            ownerId: mockUser.id,
        })
        await databaseConnection().getRepository('platform').save(mockPlatform)

        const mockProject = createMockProject({
            id: projectId,
            platformId: mockPlatform.id,
            ownerId: mockUser.id,
        })
        await databaseConnection().getRepository('project').save(mockProject)

        await databaseConnection().getRepository('user').update(mockUser.id, {
            platformId: mockPlatform.id,
        })

        engineToken = await generateMockToken({
            type: PrincipalType.ENGINE,
            id: apId(),
            projectId,
        })

        userToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
            projectId,
            platform: {
                id: mockPlatform.id,
            },
        })

        serviceToken = await generateMockToken({
            type: PrincipalType.SERVICE,
            id: apId(),
            projectId,
        })
    })

    describe('POST /v1/store-entries', () => {
        it('should handle token type engineToken correctly and return 200', async () => {
            const key = 'new_key_1'
            const response = await makePostRequest(engineToken, key, 'random_value_0')
            expect(response?.statusCode).toBe(200)
        })

        it('should handle token type userToken correctly and return 200', async () => {
            const key = 'new_key_2'
            const response = await makePostRequest(userToken, key, 'random_value_0')
            expect(response?.statusCode).toBe(200)
        })

        it('should handle token type serviceToken correctly and return 401', async () => {
            const key = 'new_key_3'
            const response = await makePostRequest(serviceToken, key, 'random_value_0')
            expect(response?.statusCode).toBe(403)
        })

        it('should save and update the value', async () => {
            const key = 'new_key_1'

            let response = await makePostRequest(engineToken, key, 'random_value_0')
            const firstResponseBody = response?.json()
            expect(response?.statusCode).toBe(200)
            expect(firstResponseBody.key).toEqual(key)
            expect(firstResponseBody.projectId).toEqual(projectId)
            expect(firstResponseBody.value).toEqual('random_value_0')

            response = await makePostRequest(engineToken, key, 'random_value_1')
            const secondResponseBody = response?.json()
            expect(response?.statusCode).toBe(200)
            expect(secondResponseBody.key).toEqual(key)
            expect(secondResponseBody.projectId).toEqual(projectId)
            expect(secondResponseBody.value).toEqual('random_value_1')
            expect(firstResponseBody.created).toEqual(secondResponseBody.created)
        })

        it('should return saved value', async () => {
            const key = 'new_key_2'

            let response = await makePostRequest(engineToken, key, 'random_value_2')
            expect(response?.statusCode).toBe(200)
            const saveResponse = response?.json()

            response = await makeGetRequest(engineToken, key)
            expect(response?.statusCode).toBe(200)
            const getResponse = response?.json()

            expect(getResponse.key).toEqual(saveResponse.key)
            expect(getResponse.value).toEqual(saveResponse.value)
            expect(getResponse.projectId).toEqual(saveResponse.projectId)
        })

        it('should delete saved value', async () => {
            const key = 'new_key_3'

            let response = await makePostRequest(engineToken, key, 'random_value_3')
            expect(response?.statusCode).toBe(200)

            response = await makeDeleteRequest(engineToken, key)
            expect(response?.statusCode).toBe(200)

            response = await makeGetRequest(engineToken, key)
            expect(response?.statusCode).toBe(404)
        })
    })
})

function makePostRequest(testToken: string, key: string, value: string): Promise<LightMyRequestResponse> | undefined {
    return app?.inject({
        method: 'POST',
        url: '/v1/store-entries/',
        headers: {
            authorization: `Bearer ${testToken}`,
        },
        body: {
            key,
            value,
        },
    })
}

function makeGetRequest(testToken: string, key: string): Promise<LightMyRequestResponse> | undefined {
    return app?.inject({
        method: 'GET',
        url: `/v1/store-entries/?key=${key}`,
        headers: {
            authorization: `Bearer ${testToken}`,
        },
    })
}

function makeDeleteRequest(testToken: string, key: string): Promise<LightMyRequestResponse> | undefined {
    return app?.inject({
        method: 'DELETE',
        url: `/v1/store-entries/?key=${key}`,
        headers: {
            authorization: `Bearer ${testToken}`,
        },
    })
}
