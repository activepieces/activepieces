import {
    ErrorHandlingOptionsParam,
    TriggerStrategy,
    WebhookHandshakeConfiguration,
    WebhookRenewConfiguration,
} from '@activepieces/pieces-framework'
import {
    ExactVersionType,
    PieceCategory,
    PrincipalType,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { Type } from '@fastify/type-provider-typebox'

const Action = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    description: Type.String(),
    requireAuth: Type.Boolean(),
    props: Type.Unknown(),
    errorHandlingOptions: Type.Optional(ErrorHandlingOptionsParam),
})

const Trigger = Type.Composite([
    Action,
    Type.Object({
        renewConfiguration: Type.Optional(WebhookRenewConfiguration),
        handshakeConfiguration: WebhookHandshakeConfiguration,
        sampleData: Type.Optional(Type.Unknown()),
        type: Type.Enum(TriggerStrategy),
        testStrategy: Type.Enum(TriggerTestStrategy),
    }),
])

export const CreatePieceRequest = {
    schema: {
        body: Type.Object({
            name: Type.String(),
            displayName: Type.String(),
            logoUrl: Type.String(),
            description: Type.Optional(Type.String()),
            version: ExactVersionType,
            auth: Type.Optional(Type.Any()),
            authors: Type.Array(Type.String()),
            categories: Type.Optional(Type.Array(Type.Enum(PieceCategory))),
            minimumSupportedRelease: ExactVersionType,
            maximumSupportedRelease: ExactVersionType,
            actions: Type.Record(Type.String(), Action),
            triggers: Type.Record(Type.String(), Trigger),
        }),
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}
