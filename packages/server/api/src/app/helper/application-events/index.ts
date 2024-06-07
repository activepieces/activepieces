import { Static, Type } from '@sinclair/typebox'
import { FastifyRequest } from 'fastify'
import { AuthenticationEvent, ConnectionEvent, FlowCreatedEvent, FlowDeletedEvent, FlowRunEvent, FlowUpdatedEvent, FolderEvent, SigningKeyEvent, SignUpEvent } from '@activepieces/ee-shared'

export const AuditEventParam = Type.Pick(Type.Union([
    ConnectionEvent,
    FlowCreatedEvent,
    FlowDeletedEvent,
    FlowUpdatedEvent,
    AuthenticationEvent,
    FolderEvent,
    SignUpEvent,
    SigningKeyEvent,
    FlowRunEvent,
]), ['data', 'action'])
export type AuditEventParam = Static<typeof AuditEventParam>


let hooks: ApplicationEventHooks = {
    async sendUserEvent(_request, _params) {
        return
    },
    async sendWorkerEvent(_params) {
        return
    },
}

export const eventsHooks = {
    set(newHooks: ApplicationEventHooks): void {
        hooks = newHooks
    },

    get(): ApplicationEventHooks {
        return hooks
    },
}

export type ApplicationEventHooks = {
    sendUserEvent(request: FastifyRequest, params: AuditEventParam): void
    sendWorkerEvent(projectId: string, params: AuditEventParam): void
}

