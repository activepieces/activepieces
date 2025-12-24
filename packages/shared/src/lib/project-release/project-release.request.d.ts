import { Static } from '@sinclair/typebox';
export declare enum ProjectReleaseType {
    GIT = "GIT",
    PROJECT = "PROJECT",
    ROLLBACK = "ROLLBACK"
}
export declare const CreateProjectReleaseFromGitRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    selectedFlowsIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.GIT>;
}>;
export declare const CreateProjectReleaseFromRollbackRequestBody: import("@sinclair/typebox").TObject<{
    projectReleaseId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    selectedFlowsIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.ROLLBACK>;
}>;
export declare const CreateProjectReleaseFromProjectRequestBody: import("@sinclair/typebox").TObject<{
    targetProjectId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    selectedFlowsIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.PROJECT>;
}>;
export declare const CreateProjectReleaseRequestBody: import("../common").TDiscriminatedUnion<[import("@sinclair/typebox").TObject<{
    projectReleaseId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    selectedFlowsIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.ROLLBACK>;
}>, import("@sinclair/typebox").TObject<{
    targetProjectId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    selectedFlowsIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.PROJECT>;
}>, import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    selectedFlowsIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    projectId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.GIT>;
}>]>;
export type CreateProjectReleaseRequestBody = Static<typeof CreateProjectReleaseRequestBody>;
export declare const DiffReleaseRequest: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.PROJECT>;
    targetProjectId: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.ROLLBACK>;
    projectReleaseId: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<ProjectReleaseType.GIT>;
}>]>;
export type DiffReleaseRequest = Static<typeof DiffReleaseRequest>;
export declare const ListProjectReleasesRequest: import("@sinclair/typebox").TObject<{
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type ListProjectReleasesRequest = Static<typeof ListProjectReleasesRequest>;
