import { ApplicationEventName } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as applicationEventsModule from '../../../../src/app/helper/application-events'
import { actionsEmitted } from '../../../helpers/application-events'
import { db } from '../../../helpers/db'
import { createMockProjectRole } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
const originalApplicationEvents = applicationEventsModule.applicationEvents

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Project role application events', () => {
    let sendUserEventSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        sendUserEventSpy = vi.fn()
        vi.spyOn(applicationEventsModule, 'applicationEvents').mockImplementation((log) => {
            const real = originalApplicationEvents(log)
            return {
                ...real,
                sendUserEvent: sendUserEventSpy,
            }
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('emits PROJECT_ROLE_CREATED on POST /v1/project-roles', async () => {
        const ctx = await createTestContext(app)
        const projectRole = createMockProjectRole({ platformId: ctx.platform.id })

        const response = await ctx.post(
            '/v1/project-roles',
            projectRole as unknown as Record<string, unknown>,
        )

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.PROJECT_ROLE_CREATED,
        ])
    })

    it('emits PROJECT_ROLE_UPDATED on POST /v1/project-roles/:id', async () => {
        const ctx = await createTestContext(app)
        const projectRole = createMockProjectRole({ platformId: ctx.platform.id })
        await db.save('project_role', projectRole)

        const response = await ctx.post(
            `/v1/project-roles/${projectRole.id}`,
            { name: faker.lorem.word(), permissions: ['read'] } as Record<string, unknown>,
        )

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.PROJECT_ROLE_UPDATED,
        ])
    })

    it('emits PROJECT_ROLE_DELETED on DELETE /v1/project-roles/:name', async () => {
        const ctx = await createTestContext(app)
        const projectRole = createMockProjectRole({ platformId: ctx.platform.id })
        await db.save('project_role', projectRole)

        const response = await ctx.delete(`/v1/project-roles/${projectRole.name}`)

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.PROJECT_ROLE_DELETED,
        ])
    })
})

