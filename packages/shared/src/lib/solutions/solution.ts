import { Static, Type } from '@sinclair/typebox'
import { ProjectState } from '../project-release/project-state'
export const Solution = Type.Object({
    name: Type.String(),
    description: Type.String(),
    state: ProjectState,
})

export type Solution = Static<typeof Solution>

export const ExportRequestBody = Type.Object({
    projectId: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
})

export type ExportRequestBody = Static<typeof ExportRequestBody>

export const SolutionRequestBody = Type.Composite([
    Solution, 
    Type.Object({
        projectId: Type.String(),
    }),
])

export type SolutionRequestBody = Static<typeof SolutionRequestBody>