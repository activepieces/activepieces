import { Static } from '@sinclair/typebox';
import { RoleType } from '../common';
export declare const CreateProjectRoleRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    permissions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TEnum<typeof RoleType>;
}>;
export type CreateProjectRoleRequestBody = Static<typeof CreateProjectRoleRequestBody>;
export declare const UpdateProjectRoleRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    permissions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export type UpdateProjectRoleRequestBody = Static<typeof UpdateProjectRoleRequestBody>;
export declare const ListProjectMembersForProjectRoleRequestQuery: import("@sinclair/typebox").TObject<{
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type ListProjectMembersForProjectRoleRequestQuery = Static<typeof ListProjectMembersForProjectRoleRequestQuery>;
