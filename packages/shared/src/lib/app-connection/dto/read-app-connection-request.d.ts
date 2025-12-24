import { Static } from '@sinclair/typebox';
import { AppConnectionScope, AppConnectionStatus } from '../app-connection';
export declare const ListAppConnectionsRequestQuery: import("@sinclair/typebox").TObject<{
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof AppConnectionScope>>;
    pieceName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    displayName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof AppConnectionStatus>>>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type ListAppConnectionsRequestQuery = Static<typeof ListAppConnectionsRequestQuery>;
export declare const GetAppConnectionForWorkerRequestQuery: import("@sinclair/typebox").TObject<{
    externalId: import("@sinclair/typebox").TString;
}>;
export type GetAppConnectionForWorkerRequestQuery = Static<typeof GetAppConnectionForWorkerRequestQuery>;
export declare const ListGlobalConnectionsRequestQuery: import("@sinclair/typebox").TObject<{
    pieceName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    scope: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof AppConnectionScope>>;
    displayName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof AppConnectionStatus>>>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type ListGlobalConnectionsRequestQuery = Static<typeof ListGlobalConnectionsRequestQuery>;
export declare const ListAppConnectionOwnersRequestQuery: import("@sinclair/typebox").TObject<{
    projectId: import("@sinclair/typebox").TString;
}>;
export type ListAppConnectionOwnersRequestQuery = Static<typeof ListAppConnectionOwnersRequestQuery>;
