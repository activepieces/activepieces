import { Static, Type } from '@sinclair/typebox'
import { FlowVersion } from '../flows/flow-version'


export const FlowVersionTemplate = Type.Omit(
    FlowVersion,
    ['id', 'created', 'updated', 'flowId', 'state', 'updatedBy', 'agentIds', 'connectionIds', 'backupFiles'],
)
export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>


export const Collection = Type.Object({
    flowTemplates: Type.Optional(Type.Array(FlowVersionTemplate)),
})
export type Collection = Static<typeof Collection>