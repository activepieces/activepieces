import { Static } from '@sinclair/typebox';
export declare const ProjectRole: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    permissions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TString;
    userCount: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type ProjectRole = Static<typeof ProjectRole>;
