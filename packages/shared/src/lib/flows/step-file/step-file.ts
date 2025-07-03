import { Static, Type } from '@sinclair/typebox'
import { ApMultipartFile } from '../../common'

export const StepFileUpsertRequest = Type.Object({
    flowId: Type.String(),
    stepName: Type.String(),
    file: Type.Optional(Type.Pick(ApMultipartFile, ['data'])),
    contentLength: Type.Number(),
    fileName: Type.String(),
})

export type StepFileUpsert = Static<typeof StepFileUpsertRequest>

export const StepFileUpsertResponse = Type.Object({
    uploadUrl: Type.Optional(Type.String()),
    url: Type.String(),
})

export type StepFileUpsertResponse = Static<typeof StepFileUpsertResponse>