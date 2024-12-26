import { Static, Type } from '@sinclair/typebox'
import { PopulatedFlow } from '../flows/flow'
import { ProjectMappingState } from '../project/project'

export const FlowState = PopulatedFlow
export type FlowState = Static<typeof FlowState>

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
    mapping: ProjectMappingState
})

export type ProjectState = Static<typeof ProjectState>
