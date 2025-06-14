import { ProjectId, TodoActivityChanged, TodoChanged, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'


export const todoSideEfffects = (_log: FastifyBaseLogger) => ({
    async notify({ socket, todoId, projectId }: NotifyParams) {
        const request: TodoChanged = {
            todoId,
        }
        socket.to(projectId).emit(WebsocketClientEvent.TODO_CHANGED, request)
    },
    async notifyActivity({ socket, projectId, activityId, content }: NotifyActivityParams) {
        const request: TodoActivityChanged = {
            activityId,
            content,
        }
        socket.to(projectId).emit(WebsocketClientEvent.TODO_ACTIVITY_CHANGED, request)
    },
})

type NotifyParams = {
    socket: Socket
    todoId: string
    projectId: ProjectId
}

type NotifyActivityParams = {
    socket: Socket
    projectId: ProjectId
    activityId: string
    content: string
}