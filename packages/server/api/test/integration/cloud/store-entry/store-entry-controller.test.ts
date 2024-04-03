import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser } from '../../../helpers/mocks'
import { apId, PrincipalType, User } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Store-entries API', () => {
    const projectId = '10'
    let testToken: string
    let mockUser: User

    beforeEach(async () => {
        mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)

        testToken = await generateMockToken({
            type: PrincipalType.WORKER,
            id: apId(),
            projectId,
        })
    })

    describe('POST /v1/store-entries', () => {
        it('should save and update the value', async () => {
            const key = 'new_key_1'

            let response = await makePostRequest(testToken, key, 'random_value_0')
            const firstResponseBody = response?.json()
            expect(response?.statusCode).toBe(200)
            expect(firstResponseBody.key).toEqual(key)
            expect(firstResponseBody.projectId).toEqual(projectId)
            expect(firstResponseBody.value).toEqual('random_value_0')

            response = await makePostRequest(testToken, key, 'random_value_1')
            const secondResponseBody = response?.json()
            expect(response?.statusCode).toBe(200)
            expect(secondResponseBody.key).toEqual(key)
            expect(secondResponseBody.projectId).toEqual(projectId)
            expect(secondResponseBody.value).toEqual('random_value_1')
            expect(firstResponseBody.created).toEqual(secondResponseBody.created)
        })

        it('should return saved value', async () => {
            const key = 'new_key_2'
            
            let response = await makePostRequest(testToken, key, 'random_value_2')
            expect(response?.statusCode).toBe(200)
            const saveResponse = response?.json()

            response = await makeGetRequest(testToken, key)
            expect(response?.statusCode).toBe(200)
            const getResponse = response?.json()

            expect(getResponse.key).toEqual(saveResponse.key)
            expect(getResponse.value).toEqual(saveResponse.value)
            expect(getResponse.projectId).toEqual(saveResponse.projectId)
        })

        it('should delete saved value', async () => {
            const key = 'new_key_3'
            
            let response = await makePostRequest(testToken, key, 'random_value_3')
            expect(response?.statusCode).toBe(200)

            response = await makeDeleteRequest(testToken, key)
            expect(response?.statusCode).toBe(200)

            response = await makeGetRequest(testToken, key)
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
