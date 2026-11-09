import { ProjectRole } from '@activepieces/core-utils'
import { apId, DefaultProjectRole, PlatformRole, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { websocketService } from '../../../../src/app/core/websockets.service'
import * as flowRunServiceModule from '../../../../src/app/flows/flow-run/flow-run-service'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
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
})

async function setup(): Promise<Scenario> {
    const { mockPlatform: platform, mockProject: forbiddenProject, mockOwner: owner } = await mockAndSaveBasicSetup()
    const viewerProject = createMockProject({ ownerId: owner.id, platformId: platform.id })
    const editorProject = createMockProject({ ownerId: owner.id, platformId: platform.id })
    await db.save('project', [viewerProject, editorProject])

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
}
