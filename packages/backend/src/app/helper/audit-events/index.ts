
import { ApplicationEventName } from '@activepieces/ee-shared'
import { AppConnection, Folder, PopulatedFlow } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'


type CreateAuditEventParam = {
    action: ApplicationEventName.UPDATED_FOLDER | ApplicationEventName.DELETED_FOLDER | ApplicationEventName.CREATED_FOLDER
    folder: Folder
    userId: string
} | {
    action: ApplicationEventName.UPSERTED_CONNECTION | ApplicationEventName.DELETED_CONNECTION
    connection: AppConnection
    userId: string
} | {
    action: ApplicationEventName.CREATED_FLOW | ApplicationEventName.DELETED_FLOW
    flow: PopulatedFlow
    userId: string
} | {
    action: ApplicationEventName.SIGNED_IN | ApplicationEventName.SIGNED_UP | ApplicationEventName.RESET_PASSWORD | ApplicationEventName.VERIFIED_EMAIL
    userId: string
    projectId: string
}


let hooks: ApplicationEventHooks = {
    async send(_request, _params) {
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
    send(request: FastifyRequest, params: CreateAuditEventParam): Promise<void>
}