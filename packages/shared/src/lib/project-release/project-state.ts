import { Static, Type } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'

export const FlowState = PopulatedFlow
export type FlowState = Static<typeof FlowState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
})

export type ProjectState = Static<typeof ProjectState>
