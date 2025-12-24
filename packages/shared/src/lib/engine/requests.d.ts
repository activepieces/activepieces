import { Static } from '@sinclair/typebox';
import { FlowRunStatus } from '../flow-run/execution/flow-execution';
import { ProgressUpdateType } from './engine-operation';
export declare const UpdateRunProgressRequest: import("@sinclair/typebox").TObject<{
    runId: import("@sinclair/typebox").TString;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    status: import("@sinclair/typebox").TEnum<typeof FlowRunStatus>;
    projectId: import("@sinclair/typebox").TString;
    progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
    workerHandlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    httpRequestId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    logsFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stepNameToTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    failedStep: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        displayName: import("@sinclair/typebox").TString;
        message: import("@sinclair/typebox").TString;
    }>>;
    startTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    finishTime: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stepResponse: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        runId: import("@sinclair/typebox").TString;
        success: import("@sinclair/typebox").TBoolean;
        input: import("@sinclair/typebox").TUnknown;
        output: import("@sinclair/typebox").TUnknown;
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        standardError: import("@sinclair/typebox").TString;
        standardOutput: import("@sinclair/typebox").TString;
    }>>;
    pauseMetadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../flow-run/execution/flow-execution").PauseType.DELAY>;
        resumeDateTime: import("@sinclair/typebox").TString;
        requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../flow-run/execution/flow-execution").PauseType.WEBHOOK>;
        requestId: import("@sinclair/typebox").TString;
        requestIdToReply: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        response: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
            body: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnknown>;
            headers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        }>;
        handlerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        progressUpdateType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ProgressUpdateType>>;
    }>]>>;
    stepsCount: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>;
export declare const UpdateStepProgressRequest: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
    stepResponse: import("@sinclair/typebox").TObject<{
        runId: import("@sinclair/typebox").TString;
        success: import("@sinclair/typebox").TBoolean;
        input: import("@sinclair/typebox").TUnknown;
        output: import("@sinclair/typebox").TUnknown;
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        standardError: import("@sinclair/typebox").TString;
        standardOutput: import("@sinclair/typebox").TString;
    }>;
}>;
export type UpdateStepProgressRequest = Static<typeof UpdateStepProgressRequest>;
export declare const UploadLogsQueryParams: import("@sinclair/typebox").TObject<{
    token: import("@sinclair/typebox").TString;
}>;
export type UploadLogsQueryParams = Static<typeof UploadLogsQueryParams>;
export declare enum UploadLogsBehavior {
    UPLOAD_DIRECTLY = "UPLOAD_DIRECTLY",
    REDIRECT_TO_S3 = "REDIRECT_TO_S3"
}
export declare const UploadLogsToken: import("@sinclair/typebox").TObject<{
    logsFileId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowRunId: import("@sinclair/typebox").TString;
    behavior: import("@sinclair/typebox").TEnum<typeof UploadLogsBehavior>;
}>;
export type UploadLogsToken = Static<typeof UploadLogsToken>;
export declare const SendFlowResponseRequest: import("@sinclair/typebox").TObject<{
    workerHandlerId: import("@sinclair/typebox").TString;
    httpRequestId: import("@sinclair/typebox").TString;
    runResponse: import("@sinclair/typebox").TObject<{
        status: import("@sinclair/typebox").TNumber;
        body: import("@sinclair/typebox").TAny;
        headers: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>;
    }>;
}>;
export type SendFlowResponseRequest = Static<typeof SendFlowResponseRequest>;
export declare const GetFlowVersionForWorkerRequest: import("@sinclair/typebox").TObject<{
    versionId: import("@sinclair/typebox").TString;
}>;
export type GetFlowVersionForWorkerRequest = Static<typeof GetFlowVersionForWorkerRequest>;
