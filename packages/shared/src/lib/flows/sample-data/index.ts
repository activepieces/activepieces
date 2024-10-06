import { Static, Type } from '@sinclair/typebox'


export const SaveSampleDataRequest = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
    payload: Type.Unknown(),
})
export type SaveSampleDataRequest = Static<typeof SaveSampleDataRequest>

export const CreateStepRunRequestBody = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
    id: Type.String(),
})

export type CreateStepRunRequestBody = Static<typeof CreateStepRunRequestBody>

export const StepRunResponse = Type.Object({
    id: Type.String(),
    success: Type.Boolean(),
    output: Type.Unknown(),
    sampleDataFileId: Type.Optional(Type.String()),
    standardError: Type.String(),
    standardOutput: Type.String(),
})

export type StepRunResponse = Static<typeof StepRunResponse>

export const StepExecutionPath = Type.Array(Type.Tuple([Type.String(), Type.Number()]))
export type StepExecutionPath = Static<typeof StepExecutionPath>


export const SampleDataSetting = Type.Object(
    {
        sampleDataFileId: Type.Optional(Type.String()),
        lastTestDate: Type.Optional(Type.String()),
        customizedInputs: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    },
    {
        additionalProperties: true,
    },
)

export type SampleDataSettings = Static<typeof SampleDataSetting>

export const DEFAULT_SAMPLE_DATA_SETTINGS: SampleDataSettings = {
    sampleDataFileId: undefined,
    customizedInputs: undefined,
}