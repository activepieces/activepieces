import { ProjectRole } from '@activepieces/core-utils'
import { apId, DefaultProjectRole, PlatformRole, PrincipalType, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { websocketService } from '../../../../src/app/core/websockets.service'
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
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

type CapturedHandlers = Record<string, (data: unknown, callback?: (d: unknown) => void) => unknown>

function buildFakeSocket(token: string, projectId: string): { socket: Socket, handlers: CapturedHandlers } {
    const handlers: CapturedHandlers = {}
    const fake = {
        id: apId(),
        data: {} as Record<string, unknown>,
        handshake: { auth: { token, projectId } },
        join: async (): Promise<void> => undefined,
        on: (event: string, cb: (data: unknown, callback?: (d: unknown) => void) => unknown): void => {
            handlers[event] = cb
        },
        once: (): void => undefined,
        emit: (): boolean => true,
        to: (): { emit: () => boolean } => ({ emit: () => true }),
    }
    return { socket: fake as unknown as Socket, handlers }
}

async function connect(token: string, projectId: string): Promise<CapturedHandlers> {
    const { socket, handlers } = buildFakeSocket(token, projectId)
    await websocketService.init(socket, app.log)
    return handlers
}

function invoke<T>(handlers: CapturedHandlers, event: WebsocketServerEvent, data: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
        const handler = handlers[event]
        if (!handler) {
            reject(new Error(`no handler registered for ${event}`))
            return
        }
        const timeout = setTimeout(() => reject(new Error(`ack timeout for ${event}`)), 10000)
        void Promise.resolve(handler(data, (ack) => {
            clearTimeout(timeout)
            resolve(ack as T)
        }))
    })
}

async function setupTwoProjects(): Promise<Scenario> {
    const { mockOwner: admin, mockPlatform: platform, mockProject: projectB } = await mockAndSaveBasicSetup()

    const projectA = createMockProject({ ownerId: admin.id, platformId: platform.id })
    await db.save('project', projectA)

    const { mockUser: member } = await mockBasicUser({
        user: { platformId: platform.id, platformRole: PlatformRole.MEMBER },
    })
    const editorRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.EDITOR })
    await db.save('project_member', createMockProjectMember({
        userId: member.id,
        platformId: platform.id,
        projectId: projectA.id,
        projectRoleId: editorRole.id,
    }))

    const flowInB = createMockFlow({ projectId: projectB.id })
    await db.save('flow', flowInB)
    const flowInA = createMockFlow({ projectId: projectA.id })
    await db.save('flow', flowInA)

    const adminToken = await generateMockToken({
        id: admin.id,
        type: PrincipalType.USER,
        platform: { id: platform.id },
    })
    const memberToken = await generateMockToken({
        id: member.id,
        type: PrincipalType.USER,
        platform: { id: platform.id },
    })

    return {
        adminHandlers: await connect(adminToken, projectB.id),
        projectAOwnerHandlers: await connect(adminToken, projectA.id),
        memberHandlers: await connect(memberToken, projectA.id),
        adminUserId: admin.id,
        flowInB: flowInB.id,
        flowInA: flowInA.id,
    }
}

describe('Websocket collaborative handlers are scoped to the caller project', () => {
    it('does not disclose a foreign project roster to JOIN_PRESENCE', async () => {
        const s = await setupTwoProjects()

        await invoke(s.adminHandlers, WebsocketServerEvent.JOIN_PRESENCE, { resourceId: s.flowInB })
        const ack = await invoke<{ users: { userId: string, userEmail: string }[] }>(
            s.memberHandlers,
            WebsocketServerEvent.JOIN_PRESENCE,
            { resourceId: s.flowInB },
        )

        expect(ack.users.map(u => u.userId)).not.toContain(s.adminUserId)
    })

    it('does not grant a lock on a resource in a foreign project', async () => {
        const s = await setupTwoProjects()

        const ack = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInB },
        )

        expect(ack.acquired).toBe(false)
    })

    it('does not grant a lock on a resource id that does not exist', async () => {
        const s = await setupTwoProjects()

        const ack = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: apId() },
        )

        expect(ack.acquired).toBe(false)
    })

    it('does not let a foreign caller force-steal a lock held in another project', async () => {
        const s = await setupTwoProjects()

        const adminAck = await invoke<{ acquired: boolean }>(
            s.adminHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInB },
        )
        expect(adminAck.acquired).toBe(true)

        const memberAck = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInB, force: true },
        )

        expect(memberAck.acquired).toBe(false)
    })

    it('does not disclose a foreign project roster across platforms', async () => {
        const victim = await mockAndSaveBasicSetup()
        const attacker = await mockAndSaveBasicSetup()

        const victimFlow = createMockFlow({ projectId: victim.mockProject.id })
        await db.save('flow', victimFlow)

        const victimHandlers = await connect(
            await generateMockToken({ id: victim.mockOwner.id, type: PrincipalType.USER, platform: { id: victim.mockPlatform.id } }),
            victim.mockProject.id,
        )
        const attackerHandlers = await connect(
            await generateMockToken({ id: attacker.mockOwner.id, type: PrincipalType.USER, platform: { id: attacker.mockPlatform.id } }),
            attacker.mockProject.id,
        )

        await invoke(victimHandlers, WebsocketServerEvent.JOIN_PRESENCE, { resourceId: victimFlow.id })
        const ack = await invoke<{ users: { userId: string }[] }>(
            attackerHandlers,
            WebsocketServerEvent.JOIN_PRESENCE,
            { resourceId: victimFlow.id },
        )

        expect(ack.users.map(u => u.userId)).not.toContain(victim.mockOwner.id)
    })

    it('does not leak the lock holder identity to a foreign caller', async () => {
        const s = await setupTwoProjects()

        await invoke(s.adminHandlers, WebsocketServerEvent.LOCK_RESOURCE, { resourceId: s.flowInB })
        const ack = await invoke<{ acquired: boolean, lock: { userId: string } | null }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInB },
        )

        expect(ack.lock).toBeNull()
    })

    it('rejects a resourceId that is not a string instead of coercing it into a shared key', async () => {
        const s = await setupTwoProjects()

        const ack = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: { nested: 'value' } },
        )

        expect(ack.acquired).toBe(false)
    })

    it('still allows a lock on a resource inside the caller project', async () => {
        const s = await setupTwoProjects()

        const ack = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInA },
        )

        expect(ack.acquired).toBe(true)
    })

    it('still returns the caller own roster for a resource inside the caller project', async () => {
        const s = await setupTwoProjects()

        const ack = await invoke<{ users: { userId: string }[] }>(
            s.memberHandlers,
            WebsocketServerEvent.JOIN_PRESENCE,
            { resourceId: s.flowInA },
        )

        expect(ack.users.length).toBe(1)
    })

    it('still allows a take-over of a lock held by someone else in the caller project', async () => {
        const s = await setupTwoProjects()

        const firstAck = await invoke<{ acquired: boolean }>(
            s.projectAOwnerHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInA },
        )
        expect(firstAck.acquired).toBe(true)

        const blockedAck = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInA },
        )
        expect(blockedAck.acquired).toBe(false)

        const takeOverAck = await invoke<{ acquired: boolean }>(
            s.memberHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: s.flowInA, force: true },
        )
        expect(takeOverAck.acquired).toBe(true)
    })
})

describe('Websocket LOCK_RESOURCE respects the project role', () => {
    it('does not let a Viewer take the editor lock on a flow in their own project', async () => {
        const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

        const { mockUser: viewer } = await mockBasicUser({
            user: { platformId: mockPlatform.id, platformRole: PlatformRole.MEMBER },
        })
        const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', { name: DefaultProjectRole.VIEWER })
        await db.save('project_member', createMockProjectMember({
            userId: viewer.id,
            platformId: mockPlatform.id,
            projectId: mockProject.id,
            projectRoleId: viewerRole.id,
        }))

        const flow = createMockFlow({ projectId: mockProject.id })
        await db.save('flow', flow)

        const viewerHandlers = await connect(
            await generateMockToken({ id: viewer.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } }),
            mockProject.id,
        )
        const ownerHandlers = await connect(
            await generateMockToken({ id: mockOwner.id, type: PrincipalType.USER, platform: { id: mockPlatform.id } }),
            mockProject.id,
        )

        const viewerAck = await invoke<{ acquired: boolean }>(
            viewerHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: flow.id },
        )
        expect(viewerAck.acquired).toBe(false)

        const ownerAck = await invoke<{ acquired: boolean }>(
            ownerHandlers,
            WebsocketServerEvent.LOCK_RESOURCE,
            { resourceId: flow.id },
        )
        expect(ownerAck.acquired).toBe(true)

        const presenceAck = await invoke<{ users: { userId: string }[] }>(
            viewerHandlers,
            WebsocketServerEvent.JOIN_PRESENCE,
            { resourceId: flow.id },
        )
        expect(presenceAck.users.map(u => u.userId)).toContain(viewer.id)
    })
})

type Scenario = {
    adminHandlers: CapturedHandlers
    projectAOwnerHandlers: CapturedHandlers
    memberHandlers: CapturedHandlers
    adminUserId: string
    flowInB: string
    flowInA: string
}
