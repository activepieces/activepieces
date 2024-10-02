import { Static, Type } from '@sinclair/typebox'
import { ApMultipartFile } from '../../common'
import { File } from '../../file'

export const StepFileUpsert = Type.Object({
    flowId: Type.String(),
    stepName: Type.String(),
    file: ApMultipartFile,
})

export type StepFileUpsert = Static<typeof StepFileUpsert>

export const StepFileWithUrl = Type.Composite([File, Type.Object({
    url: Type.String(),
})])

export type StepFileWithUrl = Static<typeof StepFileWithUrl>