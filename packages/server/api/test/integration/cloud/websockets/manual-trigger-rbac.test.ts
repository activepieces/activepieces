import { apId, DefaultProjectRole, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { websocketService } from '../../../../src/app/core/websockets.service'
import * as flowRunServiceModule from '../../../../src/app/flows/flow-run/flow-run-service'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    // `fresh` is required because this suite uses vi.spyOn on flowRunService (a server-internal module).
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

type CapturedHandlers = Record<string, (data: unknown, callback?: (d: unknown) => void) => unknown>

// A socket.io Socket stand-in that records the handlers init() registers, so a single
// event can be invoked directly (the real transport is irrelevant to this RBAC check).
function buildFakeSocket(token: string, projectId: string): { socket: Socket, handlers: CapturedHandlers } {
    const handlers: CapturedHandlers = {}
    const fake = {
        handshake: { auth: { token, projectId } },
        join: async (): Promise<void> => undefined,
        on: (event: string, cb: (data: unknown, callback?: (d: unknown) => void) => unknown): void => {
            handlers[event] = cb
        },
        emit: (): boolean => true,
    }
    return { socket: fake as unknown as Socket, handlers }
}

// Connects the given context's socket and fires MANUAL_TRIGGER_RUN_STARTED.
// Returns whether the handler reached flowRunService.startManualTrigger.
async function didStartManualRun(ctx: TestContext): Promise<boolean> {
    const startManualTrigger = vi.fn().mockResolvedValue({ id: apId() })
    vi.spyOn(flowRunServiceModule, 'flowRunService').mockReturnValue(
        { startManualTrigger } as unknown as ReturnType<typeof flowRunServiceModule.flowRunService>,
    )

    const { socket, handlers } = buildFakeSocket(ctx.token, ctx.project.id)
    await websocketService.init(socket, app.log)

    const handler = handlers[WebsocketServerEvent.MANUAL_TRIGGER_RUN_STARTED]
    await handler({ flowVersionId: apId() })

    return startManualTrigger.mock.calls.length > 0
}

describe('Websocket MANUAL_TRIGGER_RUN_STARTED RBAC', () => {
    async function setup(): Promise<{ viewer: TestContext, editor: TestContext }> {
        const admin = await createTestContext(app)
        const viewer = await createMemberContext(app, admin, { projectRole: DefaultProjectRole.VIEWER })
        const editor = await createMemberContext(app, admin, { projectRole: DefaultProjectRole.EDITOR })
        return { viewer, editor }
    }

    it('blocks a Viewer (no WRITE_RUN) from starting a manual production run', async () => {
        const { viewer } = await setup()
        expect(await didStartManualRun(viewer)).toBe(false)
    })

    it('allows an Editor (has WRITE_RUN) to start a manual production run', async () => {
        const { editor } = await setup()
        expect(await didStartManualRun(editor)).toBe(true)
    })
})
