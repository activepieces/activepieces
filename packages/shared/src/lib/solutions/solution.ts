import { Static, Type } from '@sinclair/typebox'
import { ProjectState } from '../project-release/project-state'
export const Solution = Type.Object({
    name: Type.String(),
    description: Type.String(),
    state: ProjectState,
})

export type Solution = Static<typeof Solution>

export const ExportRequestQuery = Type.Object({
    name: Type.String(),
    description: Type.Optional(Type.String()),
})

export type ExportRequestQuery = Static<typeof ExportRequestQuery>
