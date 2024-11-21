import { rolePermissions } from '@activepieces/ee-shared'
import { apId, ProjectMemberRole, ProjectRole, RoleType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection().initialize()
    app = await setupServer()

    for (const role of Object.values(ProjectMemberRole)) {
        const projectRole: ProjectRole = {
            name: role,
            permissions: rolePermissions[role],
            type: RoleType.DEFAULT,
            id: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        }
        await databaseConnection().getRepository('project_role').save(projectRole)
    }  
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('AppSumo API', () => {
    describe('Action endpoint', () => {
        it('Activates new accounts', async () => {
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
            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()

            expect(responseBody?.message).toBe('success')
            expect(responseBody?.redirect_url).toBe(
                `https://cloud.activepieces.com/sign-up?email=${mockEmail}`,
            )
        })
    })
})
