import { Static, Type } from '@sinclair/typebox'
import { ProjectState } from '../project-release/project-state'
import { ApId } from '../common/id-generator'
export const Solution = Type.Object({
    name: Type.String(),
    description: Type.String(),
    state: ProjectState,
})

export type Solution = Static<typeof Solution>

export const ImportRequestBody = Type.Object({
    solution: Solution,
    projectId: ApId,
})

export type ImportRequestBody = Static<typeof ImportRequestBody>

export const ExportRequestBody = Type.Object({
    name: Type.String(),
    projectId: ApId,
    description: Type.Optional(Type.String()),
})

export type ExportRequestBody = Static<typeof ExportRequestBody>
