import { Static, Type } from '@sinclair/typebox'
import { File } from '../../file'

export const StepFileUpsert = Type.Object({
    fileName: Type.String(),
    flowId: Type.String(),
    stepName: Type.String(),
    data: Type.Unknown(),
})

export type StepFileUpsert = Static<typeof StepFileUpsert> & { data: Buffer }

export const StepFileWithUrl = Type.Composite([File, Type.Object({
    url: Type.String(),
})])

export type StepFileWithUrl = Static<typeof StepFileWithUrl>