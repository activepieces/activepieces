import {
    ApplicationEventName,
    FlowOperationType,
    FlowStatus,
    FlowVersionState,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { flowService } from '../../../../../src/app/flows/flow/flow.service'
import * as applicationEventsModule from '../../../../../src/app/helper/application-events'
import { actionsEmitted } from '../../../../helpers/application-events'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance
const originalApplicationEvents = applicationEventsModule.applicationEvents

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('flowService emits application events for every caller', () => {
    let sendUserEventSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        sendUserEventSpy = vi.fn()
        vi.spyOn(applicationEventsModule, 'applicationEvents').mockImplementation((log) => ({
            ...originalApplicationEvents(log),
            sendUserEvent: sendUserEventSpy,
        }))
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('emits FLOW_UPDATED when the service is called directly, with no request and no controller', async () => {
        const ctx = await createTestContext(app)
        const flowId = await seedDraftFlow(ctx)

        await flowService(app.log).update({
            id: flowId,
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            operation: renameOperation,
        })

        expect(actionsEmitted(sendUserEventSpy)).toEqual([ApplicationEventName.FLOW_UPDATED])
    })

    it('emits nothing when the caller opts out with emitEvents: false', async () => {
        const ctx = await createTestContext(app)
        const flowId = await seedDraftFlow(ctx)

        await flowService(app.log).update({
            id: flowId,
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
            operation: renameOperation,
            emitEvents: false,
        })

        expect(actionsEmitted(sendUserEventSpy)).toEqual([])
    })

    it('emits FLOW_CREATED and FLOW_DELETED for the create and delete entry points', async () => {
        const ctx = await createTestContext(app)

        const created = await flowService(app.log).create({
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            ownerId: ctx.user.id,
            request: { displayName: 'Created by the service', projectId: ctx.project.id },
        })
        await flowService(app.log).delete({
            id: created.id,
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
        })

        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.FLOW_CREATED,
            ApplicationEventName.FLOW_DELETED,
        ])
    })
})

async function seedDraftFlow(ctx: TestContext): Promise<string> {
    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.DRAFT,
    })
    await db.save('flow_version', flowVersion)
    return flow.id
}

const renameOperation = {
    type: FlowOperationType.CHANGE_NAME,
    request: { displayName: 'Renamed by the service' },
} as const
