import { Pick, Static, Type } from '@sinclair/typebox'
import { File, FileType } from '../../file'

export const SaveSampleDataRequest = Type.Object({
    flowVersionId: Type.String(),
    projectId: Type.String(),
    stepName: Type.String(),
    payload: Type.Unknown(),
    fileType: Type.Optional(Type.Enum(FileType)),
})
export type SaveSampleDataRequest = Static<typeof SaveSampleDataRequest>

export const GetSampleDataRequest = Type.Object({
    flowId: Type.String(),
    flowVersionId: Type.String(),
    stepName: Type.String(),
    projectId: Type.String(),
    fileType: Type.Optional(Type.Enum(FileType)),
})
export type GetSampleDataRequest = Static<typeof GetSampleDataRequest>

export const CreateStepRunRequestBody = Type.Object({
    flowVersionId: Type.String(),
    stepName: Type.String(),
    id: Type.String(),
})

export type CreateStepRunRequestBody = Static<typeof CreateStepRunRequestBody>

export const StepRunResponse = Type.Object({
    id: Type.String(),
    success: Type.Boolean(),
    input: Type.Unknown(),
    output: Type.Unknown(),
    sampleDataFileId: Type.Optional(Type.String()),
    sampleDataInputFileId: Type.Optional(Type.String()),
    standardError: Type.String(),
    standardOutput: Type.String(),
})

export type StepRunResponse = Static<typeof StepRunResponse>

export const StepExecutionPath = Type.Array(Type.Tuple([Type.String(), Type.Number()]))
export type StepExecutionPath = Static<typeof StepExecutionPath>
export const SampleDataSetting = Type.Object(
    {
        sampleDataFileId: Type.Optional(Type.String()),
        sampleDataInputFileId: Type.Optional(Type.String()),
        lastTestDate: Type.Optional(Type.String()),
        customizedInputs: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
        schema: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
        /**
         * @deprecated This field is deprecated and will be removed in 2025.
         */
        currentSelectedData: Type.Optional(Type.Unknown()),
    },
    {
        additionalProperties: true,
    },
)

export type SampleDataSettings = Static<typeof SampleDataSetting>

export const DEFAULT_SAMPLE_DATA_SETTINGS: SampleDataSettings = {
    sampleDataFileId: undefined,
    sampleDataInputFileId: undefined,
    customizedInputs: undefined,
}

export const SaveSampleDataResponse = Pick(File, ['id', 'size', 'type'])
export type SaveSampleDataResponse = Static<typeof SaveSampleDataResponse>
