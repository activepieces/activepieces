import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common/base-model'

export const EditableColumn = Type.Object({
    fieldId: Type.String(),
    name: Type.String(),
})
export type EditableColumn = Static<typeof EditableColumn>

export const AgentSettings = Type.Object({
    ...BaseModelSchema,
    agentId: Type.String(),
    aiMode: Type.Boolean(),
    triggerOnNewRow: Type.Boolean(),
    triggerOnFieldUpdate: Type.Boolean(),
    allowAgentCreateColumns: Type.Boolean(),
    limitColumnEditing: Type.Boolean(),
    editableColumns: Type.Array(EditableColumn),
})

export type AgentSettings = Static<typeof AgentSettings>