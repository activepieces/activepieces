import { Static, Type } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'

export enum GroupStatus {
    ADDED = 'ADDED',
    DELETED = 'DELETED',
    UPDATED = 'UPDATED',
}

export const FlowState = Type.Omit(PopulatedFlow, ['externalId'])
export type FlowState = Static<typeof FlowState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
})

export type ProjectState = Static<typeof ProjectState>

export const GroupState = Type.Object({
    id: Type.String(),
    nodes: Type.Array(Type.String()),
    status: Type.Union([Type.Literal(GroupStatus.ADDED), Type.Literal(GroupStatus.DELETED), Type.Literal(GroupStatus.UPDATED)]),
})

export type GroupState = Static<typeof GroupState>
