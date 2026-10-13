import {
    EDITOR_SESSION_ID_HEADER,
    FlowOperationRequest,
    FlowOperationType,
    FlowStatus,
    FlowVersion,
    FlowVersionState,
    NoteColorVariant,
    PopulatedFlow,
    UncategorizedFolderId,
    WebsocketClientEvent,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { websocketService } from '../../../../../src/app/core/websockets.service'
import { flowService } from '../../../../../src/app/flows/flow/flow.service'
import { db } from '../../../../helpers/db'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
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
            const pushes = captureDraftPushes()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: build(ctx),
                editorSessionId: 'editor-session-1',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: 'editor-session-1' },
            }])
        })

        it('sends a null editor session id when the request has no header', async () => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const pushes = captureDraftPushes()

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

        it.each(nonDraftWrites)('sends no push for $type', async ({ build }) => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const pushes = captureDraftPushes()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: build(ctx),
                editorSessionId: 'editor-session-1',
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
            const pushes = captureDraftPushes()

            const response = await applyOperation({
                ctx,
                flowId: flow.id,
                operation: { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Edited after publish' } },
                editorSessionId: 'editor-session-1',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json().version.state).toBe(FlowVersionState.DRAFT)
            expect(pushes).toEqual([{
                room: ctx.project.id,
                payload: { flowId: flow.id, editorSessionId: 'editor-session-1' },
            }])
        })

        it('sends the push after the draft is saved', async () => {
            const ctx = await setup()
            const flow = await createFlow(ctx)
            const draftNamesAtPush: Promise<string[]>[] = []
            spyOnDraftPushes(() => {
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
            const pushes = captureDraftPushes()

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
})

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

function captureDraftPushes(): DraftPush[] {
    const pushes: DraftPush[] = []
    spyOnDraftPushes((push) => {
        pushes.push(push)
    })
    return pushes
}

function spyOnDraftPushes(onPush: (push: DraftPush) => void): void {
    const realTo = websocketService.to
    vi.spyOn(websocketService, 'to').mockImplementation((room) => {
        const operator = realTo(room)
        vi.spyOn(operator, 'emit').mockImplementation((event, ...args) => {
            if (event === WebsocketClientEvent.FLOW_DRAFT_UPDATED) {
                onPush({ room, payload: args[0] })
            }
            return true
        })
        return operator
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

type DraftPush = {
    room: string
    payload: unknown
}
