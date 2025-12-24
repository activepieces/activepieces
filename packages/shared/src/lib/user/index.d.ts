import { Static } from '@sinclair/typebox';
import { PlatformRole, UserStatus } from './user';
export * from './user';
export declare const UpdateUserRequestBody: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof UserStatus>>;
    platformRole: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof PlatformRole>>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type UpdateUserRequestBody = Static<typeof UpdateUserRequestBody>;
export declare const ListUsersRequestBody: import("@sinclair/typebox").TObject<{
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ListUsersRequestBody = Static<typeof ListUsersRequestBody>;
