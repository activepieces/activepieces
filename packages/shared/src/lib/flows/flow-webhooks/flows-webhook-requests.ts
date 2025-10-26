import { Static, Type } from '@sinclair/typebox'

export const CreateFlowsWebhooksRequestBody = Type.Object({
    targetFlowId: Type.String(),
    triggerFlowIds: Type.Array(Type.String()),
})

export type CreateFlowsWebhooksRequestBody = Static<typeof CreateFlowsWebhooksRequestBody>
