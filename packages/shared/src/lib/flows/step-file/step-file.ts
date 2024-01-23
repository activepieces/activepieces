import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common'

export const StepFile = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    flowId: Type.String(),
    projectId: Type.String(),
    stepName: Type.String(),
    size: Type.Number(),
    data: Type.Unknown(),
})

export type StepFile = Static<typeof StepFile>

export const StepFileUpsert = Type.Object({
    name: Type.String(),
    flowId: Type.String(),
    stepName: Type.String(),
    file: Type.Unknown(),
})

export type StepFileUpsert = Static<typeof StepFileUpsert>

export const StepFileGet = Type.Object({
    id: Type.String(),
    projectId: Type.String(),
})

export type StepFileGet = Static<typeof StepFileGet>

export const StepFileWithUrl = Type.Composite([StepFile, Type.Object({
    url: Type.String(),
})])

export type StepFileWithUrl = Static<typeof StepFileWithUrl>
