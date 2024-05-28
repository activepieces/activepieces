import { FastifyRequest } from 'fastify'
import { ApplicationEventName, SigningKey } from '@activepieces/ee-shared'
import { AppConnection, FlowOperationRequest, Folder, PopulatedFlow } from '@activepieces/shared'

export type CreateAuditEventParam =
  | {
      action:
      | ApplicationEventName.FOLDER_UPDATED
      | ApplicationEventName.FOLDER_DELETED
      | ApplicationEventName.FOLDER_CREATED
      folder: Folder
      userId: string
  }
  | {
      action:
      | ApplicationEventName.CONNECTION_UPSERTED
      | ApplicationEventName.CONNECTION_DELETED
      connection: AppConnection
      userId: string
  }
  | {
      action:
      | ApplicationEventName.FLOW_CREATED
      | ApplicationEventName.FLOW_DELETED
      flow: PopulatedFlow
      userId: string
  }
  | {
      action:
      | ApplicationEventName.USER_SIGNED_IN
      | ApplicationEventName.USER_PASSWORD_RESET
      | ApplicationEventName.USER_EMAIL_VERIFIED
      userId: string
  }
  | {
      action:
      | ApplicationEventName.USER_SIGNED_UP_USING_EMAIL
      | ApplicationEventName.USER_SIGNED_UP_USING_MANAGED_AUTH
      | ApplicationEventName.USER_SIGNED_UP_USING_SSO
      userId: string
      createdUser: {
          id: string
          email: string
      }
  }
  | {
      action: ApplicationEventName.FLOW_UPDATED
      flow: PopulatedFlow
      request: FlowOperationRequest
      userId: string
  } | {
      action: ApplicationEventName.SIGNING_KEY_CREATED
      userId: string
      signingKey: SigningKey
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
    send(request: FastifyRequest, params: CreateAuditEventParam): void
}
