import { apId, LockResourceResponse, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { websocketService } from '../../../../src/app/core/websockets.service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFlow, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Resource Lock per editor session', () => {
    it('denies the lock to a second editor session of the same user', async () => {
        const { flowId, openTab } = await setup()
        const tabA = await openTab()
        const tabB = await openTab()

        const first = await tabA.lock({ resourceId: flowId })
        const second = await tabB.lock({ resourceId: flowId })

        expect(first.acquired).toBe(true)
        expect(second.acquired).toBe(false)
        expect(second.lock?.userId).toBe(tabA.userId)
    })

    it('keeps the lock of the tab that took over when the tab that lost it closes', async () => {
        const { flowId, openTab } = await setup()
        const tabA = await openTab()
        const tabB = await openTab()
        await tabA.lock({ resourceId: flowId })
        const takeOver = await tabB.lock({ resourceId: flowId, force: true })
        expect(takeOver.acquired).toBe(true)

        await tabA.close()

        const tabC = await openTab()
        const third = await tabC.lock({ resourceId: flowId })
        expect(third.acquired).toBe(false)
    })

    it('releases the lock when the tab that holds it closes', async () => {
        const { flowId, openTab } = await setup()
        const tabA = await openTab()
        await tabA.lock({ resourceId: flowId })

        await tabA.close()

        const tabB = await openTab()
        const next = await tabB.lock({ resourceId: flowId })
        expect(next.acquired).toBe(true)
    })

    it('answers a lock request that arrives while the connection is still being checked', async () => {
        const { flowId, openTab } = await setup()
        const tab = await openTab({ waitForConnection: false })

        const answer = await tab.lock({ resourceId: flowId })

        expect(answer.acquired).toBe(true)
    })

})

async function setup(): Promise<Scenario> {
    const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    const flow = createMockFlow({ projectId: mockProject.id })
    await db.save('flow', flow)
    const token = await generateMockToken({
        id: mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: mockPlatform.id },
    })
    return {
        flowId: flow.id,
        openTab: ({ waitForConnection = true } = {}) => openTab({ token, projectId: mockProject.id, userId: mockOwner.id, waitForConnection }),
    }
}

async function openTab({ token, projectId, userId, waitForConnection }: OpenTabParams): Promise<Tab> {
    const handlers: Record<string, SocketHandler> = {}
    const middlewares: SocketMiddleware[] = []
    const disconnectHandlers: (() => Promise<void> | void)[] = []
    const fake = {
        id: apId(),
        data: {},
        handshake: { auth: { token, projectId } },
        join: async (): Promise<void> => undefined,
        use: (middleware: SocketMiddleware): void => {
            middlewares.push(middleware)
        },
        on: (event: string, cb: SocketHandler): void => {
            handlers[event] = cb
        },
        once: (event: string, cb: () => Promise<void> | void): void => {
            if (event === 'disconnect') {
                disconnectHandlers.push(cb)
            }
        },
        emit: (): boolean => true,
        to: (): { emit: () => boolean } => ({ emit: () => true }),
    }
    const connection = websocketService.init(fake as unknown as Socket, app.log)
    if (waitForConnection) {
        await connection
    }
    const editorSessionId = apId()
    return {
        userId,
        lock: ({ resourceId, force }) => invoke({ handlers, middlewares, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId, force, editorSessionId } }),
        close: async () => {
            for (const handler of disconnectHandlers) {
                await handler()
            }
        },
    }
}

function invoke({ handlers, middlewares, event, data }: InvokeParams): Promise<LockResourceResponse> {
    return new Promise((resolve, reject) => {
        const runMiddleware = (index: number): void => {
            const middleware = middlewares[index]
            if (middleware) {
                middleware([event, data], () => runMiddleware(index + 1))
                return
            }
            const handler = handlers[event]
            if (!handler) {
                reject(new Error(`no handler registered for ${event}`))
                return
            }
            const timeout = setTimeout(() => reject(new Error(`ack timeout for ${event}`)), 10000)
            Promise.resolve(handler(data, (ack) => {
                clearTimeout(timeout)
                resolve(LockResourceResponse.parse(ack))
            })).catch(reject)
        }
        runMiddleware(0)
    })
}

type SocketHandler = (data: unknown, callback?: (d: unknown) => void) => unknown

type SocketMiddleware = (packet: unknown[], next: () => void) => void

type Tab = {
    userId: string
    lock: (params: { resourceId: string, force?: boolean }) => Promise<LockResourceResponse>
    close: () => Promise<void>
}

type Scenario = {
    flowId: string
    openTab: (params?: { waitForConnection?: boolean }) => Promise<Tab>
}

type OpenTabParams = {
    token: string
    projectId: string
    userId: string
    waitForConnection: boolean
}

type InvokeParams = {
    handlers: Record<string, SocketHandler>
    middlewares: SocketMiddleware[]
    event: WebsocketServerEvent
    data: unknown
}
