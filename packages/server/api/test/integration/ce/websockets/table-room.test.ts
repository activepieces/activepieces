import { apId, Permission, RoleType } from '@activepieces/core-utils'
import { WebsocketServerEvent } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Socket } from 'socket.io'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { websocketService } from '../../../../src/app/core/websockets.service'
import { db } from '../../../helpers/db'
import { createMockProject, createMockProjectRole, createMockTable } from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Websocket table room', () => {
    it('joins the room of a table in the socket project and leaves it on request', async () => {
        const { ctx, tableId } = await setup()
        const conn = await connect({ token: ctx.token, projectId: ctx.project.id })

        const joined = await send({ conn, event: WebsocketServerEvent.JOIN_TABLE_ROOM, data: { tableId } })
        const roomAfterJoin = conn.rooms.has(`table:${tableId}`)
        await send({ conn, event: WebsocketServerEvent.LEAVE_TABLE_ROOM, data: { tableId } })

        expect(joined).toEqual({ joined: true })
        expect(roomAfterJoin).toBe(true)
        expect(conn.rooms.has(`table:${tableId}`)).toBe(false)
    })

    it('refuses the room to a role without READ_TABLE', async () => {
        const { ctx, tableId } = await setup()
        const role = createMockProjectRole({ platformId: ctx.platform.id, name: `role-${apId()}`, permissions: [Permission.READ_FLOW], type: RoleType.CUSTOM })
        await db.save('project_role', role)
        const member = await createMemberContext(app, ctx, { projectRole: role.name })
        const conn = await connect({ token: member.token, projectId: ctx.project.id })

        const joined = await send({ conn, event: WebsocketServerEvent.JOIN_TABLE_ROOM, data: { tableId } })

        expect(joined).toEqual({ joined: false })
        expect(conn.rooms.has(`table:${tableId}`)).toBe(false)
    })

    it('refuses the room of a table from another project', async () => {
        const { ctx } = await setup()
        const otherProject = createMockProject({ ownerId: ctx.user.id, platformId: ctx.platform.id })
        await db.save('project', otherProject)
        const otherTable = createMockTable({ projectId: otherProject.id })
        await db.save('table', otherTable)
        const conn = await connect({ token: ctx.token, projectId: ctx.project.id })

        const joined = await send({ conn, event: WebsocketServerEvent.JOIN_TABLE_ROOM, data: { tableId: otherTable.id } })

        expect(joined).toEqual({ joined: false })
        expect(conn.rooms.has(`table:${otherTable.id}`)).toBe(false)
    })

    it('leaves the table rooms of the old project on a project switch', async () => {
        const { ctx, tableId } = await setup()
        const otherProject = createMockProject({ ownerId: ctx.user.id, platformId: ctx.platform.id })
        await db.save('project', otherProject)
        const conn = await connect({ token: ctx.token, projectId: ctx.project.id })
        await send({ conn, event: WebsocketServerEvent.JOIN_TABLE_ROOM, data: { tableId } })

        const switched = await send({ conn, event: WebsocketServerEvent.SWITCH_PROJECT, data: { projectId: otherProject.id } })

        expect(switched).toEqual({ success: true })
        expect(conn.rooms.has(`table:${tableId}`)).toBe(false)
    })
})

async function setup(): Promise<{ ctx: TestContext, tableId: string }> {
    const ctx = await createTestContext(app)
    const table = createMockTable({ projectId: ctx.project.id })
    await db.save('table', table)
    return { ctx, tableId: table.id }
}

async function connect({ token, projectId }: { token: string, projectId: string }): Promise<Connection> {
    const handlers: Record<string, CapturedHandler> = {}
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
        once: (event: string, cb: CapturedHandler): void => {
            handlers[event] = cb
        },
        emit: (): boolean => true,
        to: (): { emit: () => boolean } => ({ emit: () => true }),
    }
    await websocketService.init(fake as unknown as Socket, app.log)
    return { handlers, rooms }
}

async function send({ conn, event, data }: { conn: Connection, event: WebsocketServerEvent, data: unknown }): Promise<unknown> {
    const responses: unknown[] = []
    await conn.handlers[event](data, (response) => {
        responses.push(response)
    })
    return responses[0]
}

type CapturedHandler = (data: unknown, callback?: (response: unknown) => void) => unknown

type Connection = {
    handlers: Record<string, CapturedHandler>
    rooms: Set<string>
}
