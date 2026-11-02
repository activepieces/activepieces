import {
    apId,
    EDITOR_SESSION_ID_HEADER,
    FlowOperationRequest,
    FlowOperationType,
    FlowStatus,
    FlowVersion,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
    NoteColorVariant,
    PopulatedFlow,
    UncategorizedFolderId,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { websocketService } from '../../../../../src/app/core/websockets.service'
import { flowService } from '../../../../../src/app/flows/flow/flow.service'
import { db } from '../../../../helpers/db'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
import { draftPushes } from '../../../../helpers/draft-push'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Draft Push', () => {
    describeWithAuth('POST /v1/flows/:id', () => app, (setup) => {
        it.each(draftWrites)('sends FLOW_DRAFT_UPDATED with the editor session id to the project room after $type', async ({ build }) => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const pushes = draftPushes.capture()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: build(ctx),
                editorSessionId: savingTabSessionId,
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: savingTabSessionId },
            }])
        })

        it('sends a null editor session id when the request has no header', async () => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const pushes = draftPushes.capture()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Renamed' } },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: null },
            }])
        })

        it('sends a null editor session id when the header is not an ApId', async () => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const pushes = draftPushes.capture()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Renamed' } },
                editorSessionId: 'not-an-ap-id',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: null },
            }])
        })

        it.each(nonDraftWrites)('sends no push for $type', async ({ build }) => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const pushes = draftPushes.capture()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: build(ctx),
                editorSessionId: savingTabSessionId,
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(pushes).toEqual([])
        })

        it('sends a push when an edit on a published flow makes a new draft', async () => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const publishResponse = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: { type: FlowOperationType.LOCK_AND_PUBLISH, request: { status: FlowStatus.DISABLED } },
            })
            expect(publishResponse.statusCode).toBe(StatusCodes.OK)
            const pushes = draftPushes.capture()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Edited after publish' } },
                editorSessionId: savingTabSessionId,
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().version.state).toBe(FlowVersionState.DRAFT)
            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: savingTabSessionId },
            }])
        })

        it('sends the push after the draft is saved', async () => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const draftNamesAtPush: Promise<string[]>[] = []
            draftPushes.observe(() => {
                draftNamesAtPush.push(readDraftNames(flow.id))
            })

            await applyOperation({
                ctx,
                flowId: flow.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Saved before the push' } },
            })

            expect(await Promise.all(draftNamesAtPush)).toEqual([['Saved before the push']])
        })
    })

    describe('flowService.update', () => {
        it('sends a push with a null editor session id when emitEvents is false', async () => {
            const ctx = await createTestContext(app)
            const flow = await createFlow(ctx)
            const pushes = draftPushes.capture()

            await flowService(app.log).update({
                id: flow.id,
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Renamed by a release' } },
                emitEvents: false,
            })

            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: null },
            }])
        })

        it('logs one error line and still saves when the push throws', async () => {
            const ctx = await createTestContext(app)
            const flow = await createFlow(ctx)
            const pushError = new Error('socket server is down')
            vi.spyOn(websocketService, 'to').mockImplementation(() => {
                throw pushError
            })
            const logError = vi.spyOn(app.log, 'error')

            const updatedFlow = await flowService(app.log).update({
                id: flow.id,
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Saved without a push' } },
            })

            expect(updatedFlow.version.displayName).toBe('Saved without a push')
            expect(logError).toHaveBeenCalledTimes(1)
            expect(logError).toHaveBeenCalledWith(
                { error: pushError, flow: { id: flow.id }, project: { id: ctx.project.id } },
                expect.stringMatching(/^\[flowSideEffects#onDraftWritten\] /),
            )
        })
    })

    describe('writes that are not Draft Writes', () => {
        it('sends no push when a read migrates the draft to the latest schema version', async () => {
            const ctx = await createTestContext(app)
            const flow = await createFlow(ctx)
            await db.update('flow_version', flow.version.id, { schemaVersion: '20' })
            const pushes = draftPushes.capture()

            const response = await ctx.get(`/v1/flows/${flow.id}`)

            expect(response.statusCode).toBe(StatusCodes.OK)
            const storedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: flow.version.id })
            expect(storedVersion.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
            expect(pushes).toEqual([])
        })

        it('sends no push when a new flow gets its empty draft', async () => {
            const ctx = await createTestContext(app)
            const pushes = draftPushes.capture()

            await createFlow(ctx)

            expect(pushes).toEqual([])
        })

        it('sends no push when a flow is deleted', async () => {
            const ctx = await createTestContext(app)
            const flow = await createFlow(ctx)
            const pushes = draftPushes.capture()

            const response = await ctx.delete(`/v1/flows/${flow.id}`)

            expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)
            expect(pushes).toEqual([])
        })
    })
})

const savingTabSessionId = apId()

const draftWrites: WriteCase[] = [
    { type: FlowOperationType.CHANGE_NAME, build: () => ({ type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Renamed' } }) },
    { type: FlowOperationType.LOCK_AND_PUBLISH, build: () => ({ type: FlowOperationType.LOCK_AND_PUBLISH, request: { status: FlowStatus.DISABLED } }) },
    { type: FlowOperationType.ADD_NOTE, build: () => ({ type: FlowOperationType.ADD_NOTE, request: { id: 'note-1', content: 'A note', color: NoteColorVariant.YELLOW, position: { x: 0, y: 0 }, size: { width: 200, height: 100 } } }) },
]

const nonDraftWrites: WriteCase[] = [
    { type: FlowOperationType.CHANGE_STATUS, build: () => ({ type: FlowOperationType.CHANGE_STATUS, request: { status: FlowStatus.DISABLED } }) },
    { type: FlowOperationType.CHANGE_FOLDER, build: () => ({ type: FlowOperationType.CHANGE_FOLDER, request: { folderId: UncategorizedFolderId } }) },
    { type: FlowOperationType.UPDATE_METADATA, build: () => ({ type: FlowOperationType.UPDATE_METADATA, request: { metadata: { source: 'test' } } }) },
    { type: FlowOperationType.UPDATE_MINUTES_SAVED, build: () => ({ type: FlowOperationType.UPDATE_MINUTES_SAVED, request: { timeSavedPerRun: 5 } }) },
    { type: FlowOperationType.UPDATE_OWNER, build: (ctx) => ({ type: FlowOperationType.UPDATE_OWNER, request: { ownerId: ctx.user.id } }) },
]

async function createFlow(ctx: TestContext): Promise<PopulatedFlow> {
    const response = await ctx.post('/v1/flows', {
        displayName: 'Draft Push flow',
        projectId: ctx.project.id,
    }, { query: { projectId: ctx.project.id } })
    expect(response.statusCode).toBe(StatusCodes.CREATED)
    return response.json()
}

function applyOperation({ ctx, flowId, operation, editorSessionId }: ApplyOperationParams): ReturnType<FastifyInstance['inject']> {
    return ctx.inject({
        method: 'POST',
        url: `/api/v1/flows/${flowId}`,
        headers: editorSessionId === undefined ? {} : { [EDITOR_SESSION_ID_HEADER]: editorSessionId },
        body: operation,
    })
}

async function readDraftNames(flowId: string): Promise<string[]> {
    const versions = await db.findBy<FlowVersion>('flow_version', { flowId })
    return versions.map((version) => version.displayName)
}

type ApplyOperationParams = {
    ctx: TestContext
    flowId: string
    operation: FlowOperationRequest
    editorSessionId?: string
}

type WriteCase = {
    type: FlowOperationType
    build: (ctx: TestContext) => FlowOperationRequest
}
