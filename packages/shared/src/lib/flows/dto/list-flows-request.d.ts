import { Static } from '@sinclair/typebox';
import { Cursor } from '../../common/seek-page';
import { FlowStatus } from '../flow';
import { FlowVersionState } from '../flow-version';
export declare const ListFlowsRequest: import("@sinclair/typebox").TObject<{
    folderId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof FlowStatus>>>;
    projectId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    agentExternalIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    versionState: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof FlowVersionState>>;
    connectionExternalIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    externalIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export type ListFlowsRequest = Omit<Static<typeof ListFlowsRequest>, 'cursor'> & {
    cursor: Cursor | undefined;
};
export declare const GetFlowQueryParamsRequest: import("@sinclair/typebox").TObject<{
    versionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type GetFlowQueryParamsRequest = Static<typeof GetFlowQueryParamsRequest>;
export declare const ListFlowVersionRequest: import("@sinclair/typebox").TObject<{
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ListFlowVersionRequest = Omit<Static<typeof ListFlowVersionRequest>, 'cursor'> & {
    cursor: Cursor | undefined;
};
