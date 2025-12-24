import { Static } from '@sinclair/typebox';
import { ProjectType } from './project';
export declare const ListProjectRequestForUserQueryParams: import("@sinclair/typebox").TObject<{
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    displayName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    types: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof ProjectType>>>;
}>;
export type ListProjectRequestForUserQueryParams = Static<typeof ListProjectRequestForUserQueryParams>;
