import { TriggerStrategy } from '@activepieces/pieces-framework'
import { SemVerType } from '@activepieces/shared'
import { Type } from '@fastify/type-provider-typebox'

const Action = Type.Object({
    name: Type.String(),
    displayName: Type.String(),
    description: Type.String(),
    sampleData: Type.Unknown(),
    props: Type.Unknown(),
})

const Trigger = Type.Composite([
    Action,
    Type.Object({
        type: Type.Enum(TriggerStrategy),
    }),
])

export const CreatePieceRequest = {
    schema: {
        body: Type.Object({
            name: Type.String(),
            displayName: Type.String(),
            logoUrl: Type.String(),
            description: Type.Optional(Type.String()),
            version: SemVerType,
            minimumSupportedRelease: SemVerType,
            maximumSupportedRelease: SemVerType,
            actions: Type.Record(Type.String(), Action),
            triggers: Type.Record(Type.String(), Trigger),
        }),
    },
}
