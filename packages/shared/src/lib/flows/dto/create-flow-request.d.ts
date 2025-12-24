import { Static } from '@sinclair/typebox';
export declare const CreateFlowRequest: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    /**If folderId is provided, folderName is ignored */
    folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    folderName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
}>;
export type CreateFlowRequest = Static<typeof CreateFlowRequest>;
