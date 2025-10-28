import { ProjectId, TodoActivityChanged, TodoActivityCreated, TodoChanged, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Server } from 'socket.io'


export const todoSideEfffects = (_log: FastifyBaseLogger) => ({
    async notify({ socket, todoId, projectId }: NotifyParams) {
        const request: TodoChanged = {
            todoId,
        }
        socket.to(projectId).emit(WebsocketClientEvent.TODO_CHANGED, request)
    },
    async notifyActivity({ socket, projectId, activityId, todoId, content }: NotifyActivityParams) {
        const request: TodoActivityChanged = {
            activityId,
            todoId,
            content,
        }
        socket.to(projectId).emit(WebsocketClientEvent.TODO_ACTIVITY_CHANGED, request)
    },
    async notifyActivityCreated({ socket, projectId, todoId }: NotifyActivityCreatedParams) {
        const request: TodoActivityCreated = {
            todoId,
        }
        socket.to(projectId).emit(WebsocketClientEvent.TODO_ACTIVITY_CREATED, request)
    },  
})

type NotifyActivityCreatedParams = {
    socket: Server
    projectId: ProjectId
    todoId: string
}

type NotifyParams = {
    socket: Server
    todoId: string
    projectId: ProjectId
}

type NotifyActivityParams = {
    socket: Server
    projectId: ProjectId
    activityId: string
    todoId: string
    content: string
}