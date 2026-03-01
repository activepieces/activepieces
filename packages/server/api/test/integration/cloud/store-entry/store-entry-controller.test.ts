import { apId, DefaultProjectRole, PlatformRole, PrincipalType, User } from '@activepieces/shared'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockProjectMember, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'

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
    let engineToken: string
    let mockUser: User
    let projectId: string

    beforeEach(async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        projectId = mockProject.id

        const { mockUser: user } = await mockBasicUser({
            user: {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            },
        })
        mockUser = user

        const projectRole = await databaseConnection()
            .getRepository('project_role')
            .findOneByOrFail({ name: DefaultProjectRole.ADMIN })

        const mockProjectMember = createMockProjectMember({
            userId: mockUser.id,
            platformId: mockPlatform.id,
            projectId,
            projectRoleId: projectRole.id,
        })
        await databaseConnection().getRepository('project_member').save(mockProjectMember)

        engineToken = await generateMockToken({
            type: PrincipalType.ENGINE,
            id: apId(),
            projectId,
            platform: {
                id: mockPlatform.id,
            },
        })
    })

    describe('POST /v1/store-entries', () => {
        it('should handle token type engineToken correctly and return 200', async () => {
            const key = 'new_key_1'
            const response = await makePostRequest(engineToken, key, 'random_value_0')
            expect(response?.statusCode).toBe(200)
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

function makePostRequest(testToken: string, key: string, value: string, projectId?: string): Promise<LightMyRequestResponse> | undefined {
    return app?.inject({
        method: 'POST',
        url: '/v1/store-entries/',
        headers: {
            authorization: `Bearer ${testToken}`,
        },
        body: {
            projectId,
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
