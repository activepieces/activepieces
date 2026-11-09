import { isNil, Permission, tryCatch } from '@activepieces/core-utils'
import { JoinTableRoomResponse, PrincipalType, TableRoomRequest, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { Socket } from 'socket.io'
import { websocketService } from '../../core/websockets.service'
import { tableService } from '../table/table.service'
import { tableRoom } from './table-room'

export const tableRoomModule: FastifyPluginAsyncZod = async (app) => {
    websocketService.onProjectLeave({
        name: 'table-room',
        handler: ({ socket }) => leaveAllTableRooms({ socket, log: app.log }),
    })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.JOIN_TABLE_ROOM, (socket) => {
        return async (data: unknown, principal, projectId, callback) => {
            const request = TableRoomRequest.safeParse(data)
            if (!request.success) {
                callback?.(NOT_JOINED)
                return
            }
            const { tableId } = request.data
            const { data: table, error } = await tryCatch(() => tableService.getOneOrThrow({ projectId, id: tableId }))
            if (isNil(table)) {
                app.log.warn({ error, table: { id: tableId }, user: { id: principal.id }, project: { id: projectId } }, '[JOIN_TABLE_ROOM] Denied: table not found in this project')
                callback?.(NOT_JOINED)
                return
            }
            await socket.join(tableRoom(app.log).name(table.id))
            trackTableRoom({ socket, tableId: table.id })
            callback?.({ joined: true })
        }
    }, { permission: Permission.READ_TABLE, rejectResponse: NOT_JOINED, orderedWithSwitch: true })
    websocketService.addListener(PrincipalType.USER, WebsocketServerEvent.LEAVE_TABLE_ROOM, (socket) => {
        return async (data: unknown) => {
            const request = TableRoomRequest.safeParse(data)
            if (!request.success) {
                return
            }
            await leaveTableRoom({ socket, tableId: request.data.tableId, log: app.log })
        }
    }, { orderedWithSwitch: true })
}

const NOT_JOINED: JoinTableRoomResponse = { joined: false }

const tableRoomsBySocket = new WeakMap<Socket, ReadonlySet<string>>()

function trackTableRoom({ socket, tableId }: TableRoomParams): void {
    const rooms = tableRoomsBySocket.get(socket) ?? new Set<string>()
    tableRoomsBySocket.set(socket, new Set([...rooms, tableId]))
}

async function leaveTableRoom({ socket, tableId, log }: LeaveTableRoomParams): Promise<void> {
    await socket.leave(tableRoom(log).name(tableId))
    const rooms = tableRoomsBySocket.get(socket) ?? new Set<string>()
    tableRoomsBySocket.set(socket, new Set([...rooms].filter((id) => id !== tableId)))
}

async function leaveAllTableRooms({ socket, log }: { socket: Socket, log: FastifyBaseLogger }): Promise<void> {
    for (const tableId of tableRoomsBySocket.get(socket) ?? []) {
        await leaveTableRoom({ socket, tableId, log })
    }
}

type TableRoomParams = {
    socket: Socket
    tableId: string
}

type LeaveTableRoomParams = TableRoomParams & {
    log: FastifyBaseLogger
}
