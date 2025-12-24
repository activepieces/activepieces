import { Static } from '@sinclair/typebox';
export declare const StepFileUpsertRequest: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    stepName: import("@sinclair/typebox").TString;
    file: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        data: import("@sinclair/typebox").TUnknown;
    }>>;
    contentLength: import("@sinclair/typebox").TNumber;
    fileName: import("@sinclair/typebox").TString;
}>;
export type StepFileUpsert = Static<typeof StepFileUpsertRequest>;
export declare const StepFileUpsertResponse: import("@sinclair/typebox").TObject<{
    uploadUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    url: import("@sinclair/typebox").TString;
}>;
export type StepFileUpsertResponse = Static<typeof StepFileUpsertResponse>;
