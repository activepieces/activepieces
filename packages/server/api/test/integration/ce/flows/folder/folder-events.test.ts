import { ApplicationEventName } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import * as applicationEventsModule from '../../../../../src/app/helper/application-events'
import { actionsEmitted } from '../../../../helpers/application-events'
import { db } from '../../../../helpers/db'
import { createMockFolder } from '../../../../helpers/mocks'
import { createTestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance
const originalApplicationEvents = applicationEventsModule.applicationEvents

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Folder application events', () => {
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

    it('emits FOLDER_CREATED on POST /v1/folders', async () => {
        const ctx = await createTestContext(app)

        const response = await ctx.post('/v1/folders', {
            displayName: 'My folder',
            projectId: ctx.project.id,
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.FOLDER_CREATED,
        ])
    })

    it('emits FOLDER_UPDATED on POST /v1/folders/:id', async () => {
        const ctx = await createTestContext(app)
        const folder = createMockFolder({ projectId: ctx.project.id })
        await db.save('folder', folder)

        const response = await ctx.post(`/v1/folders/${folder.id}`, {
            displayName: 'Renamed folder',
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.FOLDER_UPDATED,
        ])
    })

    it('emits FOLDER_DELETED on DELETE /v1/folders/:id', async () => {
        const ctx = await createTestContext(app)
        const folder = createMockFolder({ projectId: ctx.project.id })
        await db.save('folder', folder)

        const response = await ctx.delete(`/v1/folders/${folder.id}`)

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.FOLDER_DELETED,
        ])
    })
})

