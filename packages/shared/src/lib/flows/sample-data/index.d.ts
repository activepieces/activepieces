import { Static } from '@sinclair/typebox';
export declare enum SampleDataFileType {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT"
}
export declare const DATA_TYPE_KEY_IN_FILE_METADATA = "dataType";
export declare enum SampleDataDataType {
    JSON = "JSON",
    STRING = "STRING"
}
export declare const SaveSampleDataRequest: import("@sinclair/typebox").TObject<{
    stepName: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TUnknown;
    type: import("@sinclair/typebox").TEnum<typeof SampleDataFileType>;
    dataType: import("@sinclair/typebox").TEnum<typeof SampleDataDataType>;
}>;
export type SaveSampleDataRequest = Static<typeof SaveSampleDataRequest>;
export declare const GetSampleDataRequest: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    stepName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TEnum<typeof SampleDataFileType>;
}>;
export type GetSampleDataRequest = Static<typeof GetSampleDataRequest>;
export declare const CreateStepRunRequestBody: import("@sinclair/typebox").TObject<{
    flowVersionId: import("@sinclair/typebox").TString;
    stepName: import("@sinclair/typebox").TString;
}>;
export type CreateStepRunRequestBody = Static<typeof CreateStepRunRequestBody>;
export declare const StepRunResponse: import("@sinclair/typebox").TObject<{
    runId: import("@sinclair/typebox").TString;
    success: import("@sinclair/typebox").TBoolean;
    input: import("@sinclair/typebox").TUnknown;
    output: import("@sinclair/typebox").TUnknown;
    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    standardError: import("@sinclair/typebox").TString;
    standardOutput: import("@sinclair/typebox").TString;
}>;
export type StepRunResponse = Static<typeof StepRunResponse>;
export declare const StepExecutionPath: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber]>>;
export type StepExecutionPath = Static<typeof StepExecutionPath>;
export declare const SampleDataSetting: import("@sinclair/typebox").TObject<{
    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type SampleDataSettings = Static<typeof SampleDataSetting>;
export declare const DEFAULT_SAMPLE_DATA_SETTINGS: SampleDataSettings;
export declare const SaveSampleDataResponse: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof import("../../file").FileType>;
    size: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    id: import("@sinclair/typebox").TString;
}>;
export type SaveSampleDataResponse = Static<typeof SaveSampleDataResponse>;
