import { ProjectRole } from '@activepieces/core-utils'
import { apId, DefaultProjectRole, PlatformRole, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { lockService } from '../../../../src/app/core/collaborative/lock/lock.service'
import { presenceService } from '../../../../src/app/core/collaborative/presence/presence.service'
import { websocketService } from '../../../../src/app/core/websockets.service'
import * as flowRunServiceModule from '../../../../src/app/flows/flow-run/flow-run-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockProject,
    createMockProjectMember,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Websocket SWITCH_PROJECT', () => {
    it('joins the new project room and leaves the old one', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.viewerProjectId })

        const response = await switchProject({ conn, projectId: s.editorProjectId })

        expect(response).toEqual({ success: true })
        expect(conn.rooms.has(s.editorProjectId)).toBe(true)
        expect(conn.rooms.has(s.viewerProjectId)).toBe(false)
        expect(conn.rooms.has(s.memberId)).toBe(true)
    })

    it('checks event permissions against the new project role', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.viewerProjectId })

        expect(await startedManualRunIn(conn)).toBeNull()

        await switchProject({ conn, projectId: s.editorProjectId })

        expect(await startedManualRunIn(conn)).toBe(s.editorProjectId)
    })

    it('rejects a project the user cannot access and keeps the old project', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.editorProjectId })

        const response = await switchProject({ conn, projectId: s.forbiddenProjectId })

        expect(response).toEqual({ success: false })
        expect(conn.rooms.has(s.editorProjectId)).toBe(true)
        expect(conn.rooms.has(s.forbiddenProjectId)).toBe(false)
        expect(await startedManualRunIn(conn)).toBe(s.editorProjectId)
    })

    it('lets a socket that connected without a project switch into one', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: null })

        expect(await startedManualRunIn(conn)).toBeNull()

        const response = await switchProject({ conn, projectId: s.editorProjectId })

        expect(response).toEqual({ success: true })
        expect(await startedManualRunIn(conn)).toBe(s.editorProjectId)
    })

    it('still answers switches when the handshake project is not accessible', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.forbiddenProjectId })

        expect(conn.rooms.has(s.forbiddenProjectId)).toBe(false)
        expect(await startedManualRunIn(conn)).toBeNull()

        const response = await switchProject({ conn, projectId: s.editorProjectId })

        expect(response).toEqual({ success: true })
        expect(await startedManualRunIn(conn)).toBe(s.editorProjectId)
    })

    it('releases the lock and presence held in the old project', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.editorProjectId })
        const lockAck = await send({ conn, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId: s.editorFlowId } })
        await send({ conn, event: WebsocketServerEvent.JOIN_PRESENCE, data: { resourceId: s.editorFlowId } })

        expect(lockAck).toEqual({ acquired: true, lock: null })
        expect(await presentUserIds(s)).toEqual([s.memberId])

        await switchProject({ conn, projectId: s.viewerProjectId })

        expect(await lockService(app.log).getLock({ resourceId: s.editorFlowId, projectId: s.editorProjectId })).toBeNull()
        expect(await presentUserIds(s)).toEqual([])
    })

    it('releases a lock that was still being taken when the switch arrived', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.editorProjectId })

        const [lockAck] = await Promise.all([
            send({ conn, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId: s.editorFlowId } }),
            switchProject({ conn, projectId: s.viewerProjectId }),
        ])

        expect(lockAck).toEqual({ acquired: true, lock: null })
        expect(await lockService(app.log).getLock({ resourceId: s.editorFlowId, projectId: s.editorProjectId })).toBeNull()
    })

    it('answers project events with a failure while the socket has no project', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: null })

        const lockAck = await send({ conn, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId: s.editorFlowId } })
        const presenceAck = await send({ conn, event: WebsocketServerEvent.JOIN_PRESENCE, data: { resourceId: s.editorFlowId } })

        expect(lockAck).toEqual({ acquired: false, lock: null })
        expect(presenceAck).toEqual({ users: [] })
    })

    it('runs a lock and a presence join sent while switching in the new project', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: null })

        const [switched, lockAck, presenceAck] = await Promise.all([
            switchProject({ conn, projectId: s.editorProjectId }),
            send({ conn, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId: s.editorFlowId } }),
            send({ conn, event: WebsocketServerEvent.JOIN_PRESENCE, data: { resourceId: s.editorFlowId } }),
        ])

        expect(switched).toEqual({ success: true })
        expect(lockAck).toEqual({ acquired: true, lock: null })
        expect(presenceAck).toEqual({ users: [expect.objectContaining({ userId: s.memberId })] })
    })

    it('denies a lock sent before the switch to the project that owns the resource', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.viewerProjectId })

        const [early] = await Promise.all([
            send({ conn, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId: s.editorFlowId } }),
            switchProject({ conn, projectId: s.editorProjectId }),
        ])
        const afterSwitch = await send({ conn, event: WebsocketServerEvent.LOCK_RESOURCE, data: { resourceId: s.editorFlowId } })

        expect(early).toEqual({ acquired: false, lock: null })
        expect(afterSwitch).toEqual({ acquired: true, lock: null })
    })

    it('answers a switch while a slow run start of the old project is still going', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: s.editorProjectId })
        vi.spyOn(flowRunServiceModule, 'flowRunService').mockReturnValue(
            { startManualTrigger: () => new Promise(() => undefined) } as unknown as ReturnType<typeof flowRunServiceModule.flowRunService>,
        )

        void conn.handlers[WebsocketServerEvent.MANUAL_TRIGGER_RUN_STARTED]({ flowVersionId: apId() })
        const response = await switchProject({ conn, projectId: s.viewerProjectId })

        expect(response).toEqual({ success: true })
        expect(conn.rooms.has(s.viewerProjectId)).toBe(true)
    })

    it('leaves the socket in exactly one project room after two fast switches', async () => {
        const s = await setup()
        const conn = await connect({ token: s.memberToken, projectId: null })

        const responses = await Promise.all([
            switchProject({ conn, projectId: s.viewerProjectId }),
            switchProject({ conn, projectId: s.editorProjectId }),
        ])

        expect(responses).toEqual([{ success: true }, { success: true }])
        expect(conn.rooms.has(s.viewerProjectId)).toBe(false)
        expect(conn.rooms.has(s.editorProjectId)).toBe(true)
        expect(await startedManualRunIn(conn)).toBe(s.editorProjectId)
    })
})

async function setup(): Promise<Scenario> {
    const { mockPlatform: platform, mockProject: forbiddenProject, mockOwner: owner } = await mockAndSaveBasicSetup()
    const viewerProject = createMockProject({ ownerId: owner.id, platformId: platform.id })
    const editorProject = createMockProject({ ownerId: owner.id, platformId: platform.id })
    await db.save('project', [viewerProject, editorProject])
    const editorFlow = createMockFlow({ projectId: editorProject.id })
    await db.save('flow', editorFlow)

    const { mockUser: member } = await mockBasicUser({
        user: { platformId: platform.id, platformRole: PlatformRole.MEMBER },
    })
    const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })
    const editorRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.EDITOR })
    await db.save('project_member', [
        createMockProjectMember({ userId: member.id, platformId: platform.id, projectId: viewerProject.id, projectRoleId: viewerRole.id }),
        createMockProjectMember({ userId: member.id, platformId: platform.id, projectId: editorProject.id, projectRoleId: editorRole.id }),
    ])

    const memberToken = await generateMockToken({
        id: member.id,
        type: PrincipalType.USER,
        platform: { id: platform.id },
    })
    return {
        memberToken,
        memberId: member.id,
        viewerProjectId: viewerProject.id,
        editorProjectId: editorProject.id,
        forbiddenProjectId: forbiddenProject.id,
        editorFlowId: editorFlow.id,
    }
}

async function connect({ token, projectId }: { token: string, projectId: string | null }): Promise<Connection> {
    const handlers: CapturedHandlers = {}
    const rooms = new Set<string>()
    const fake = {
        id: apId(),
        data: {},
        handshake: { auth: { token, projectId } },
        join: async (room: string): Promise<void> => {
            rooms.add(room)
        },
        leave: async (room: string): Promise<void> => {
            rooms.delete(room)
        },
        use: (): void => undefined,
        on: (event: string, cb: CapturedHandler): void => {
            handlers[event] = cb
        },
        once: (): void => undefined,
        emit: (): boolean => true,
        to: (): { emit: () => boolean } => ({ emit: () => true }),
    }
    await websocketService.init(fake as unknown as Socket, app.log)
    return { handlers, rooms }
}

async function switchProject({ conn, projectId }: { conn: Connection, projectId: string }): Promise<unknown> {
    const responses: unknown[] = []
    await conn.handlers[WebsocketServerEvent.SWITCH_PROJECT]({ projectId }, (response) => {
        responses.push(response)
    })
    return responses[0]
}

async function send({ conn, event, data }: { conn: Connection, event: WebsocketServerEvent, data: unknown }): Promise<unknown> {
    const responses: unknown[] = []
    await conn.handlers[event](data, (response) => {
        responses.push(response)
    })
    return responses[0]
}

async function presentUserIds(s: Scenario): Promise<string[]> {
    const users = await presenceService(app.log).getActiveUsers({ resourceId: s.editorFlowId, projectId: s.editorProjectId })
    return users.map((user) => user.userId)
}

async function startedManualRunIn(conn: Connection): Promise<string | null> {
    const startManualTrigger = vi.fn().mockResolvedValue({ id: apId() })
    vi.spyOn(flowRunServiceModule, 'flowRunService').mockReturnValue(
        { startManualTrigger } as unknown as ReturnType<typeof flowRunServiceModule.flowRunService>,
    )
    await conn.handlers[WebsocketServerEvent.MANUAL_TRIGGER_RUN_STARTED]({ flowVersionId: apId() })
    const call = startManualTrigger.mock.calls[0]
    vi.restoreAllMocks()
    return call ? call[0].projectId : null
}

type CapturedHandler = (data: unknown, callback?: (response: unknown) => void) => unknown

type CapturedHandlers = Record<string, CapturedHandler>

type Connection = {
    handlers: CapturedHandlers
    rooms: Set<string>
}

type Scenario = {
    memberToken: string
    memberId: string
    viewerProjectId: string
    editorProjectId: string
    forbiddenProjectId: string
    editorFlowId: string
}
