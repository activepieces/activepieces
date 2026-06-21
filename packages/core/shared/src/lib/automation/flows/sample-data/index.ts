import { z } from 'zod'
import { File } from '../../../core/file'

export enum SampleDataFileType {
    INPUT = 'INPUT',
    OUTPUT = 'OUTPUT',
}

export const DATA_TYPE_KEY_IN_FILE_METADATA = 'dataType'


export enum SampleDataDataType {
    JSON = 'JSON',
    STRING = 'STRING',
}
export const SaveSampleDataRequest = z.object({
    stepName: z.string(),
    payload: z.unknown(),
    type: z.enum(SampleDataFileType),
})
export type SaveSampleDataRequest = z.infer<typeof SaveSampleDataRequest>

export const GetSampleDataRequest = z.object({
    flowId: z.string(),
    flowVersionId: z.string(),
    stepName: z.string(),
    projectId: z.string(),
    type: z.enum(SampleDataFileType),
})
export type GetSampleDataRequest = z.infer<typeof GetSampleDataRequest>

export const CreateStepRunRequestBody = z.object({
    projectId: z.string(),
    flowVersionId: z.string(),
    stepName: z.string(),
})

export type CreateStepRunRequestBody = z.infer<typeof CreateStepRunRequestBody>

export const StepRunResponse = z.object({
    runId: z.string(),
    success: z.boolean(),
    input: z.unknown(),
    output: z.unknown(),
    sampleDataFileId: z.string().optional(),
    sampleDataInputFileId: z.string().optional(),
    standardError: z.string(),
    standardOutput: z.string(),
})

export type StepRunResponse = z.infer<typeof StepRunResponse>

export const StepExecutionPath = z.array(z.tuple([z.string(), z.number()]))
export type StepExecutionPath = z.infer<typeof StepExecutionPath>
export const SampleDataSetting = z.object(
    {
        sampleDataFileId: z.string().optional(),
        sampleDataInputFileId: z.string().optional(),
        lastTestDate: z.string().optional(),
    },
)

export type SampleDataSettings = z.infer<typeof SampleDataSetting>

export const DEFAULT_SAMPLE_DATA_SETTINGS: SampleDataSettings = {
    sampleDataFileId: undefined,
    sampleDataInputFileId: undefined,
}

export const SaveSampleDataResponse = File.pick({ id: true, size: true, type: true })
export type SaveSampleDataResponse = z.infer<typeof SaveSampleDataResponse>

