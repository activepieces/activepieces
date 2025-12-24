import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
export type UserId = ApId;
export declare enum PlatformRole {
    /**
     * Platform administrator with full control over platform settings,
     * users, and all projects
     */
    ADMIN = "ADMIN",
    /**
     * Regular platform member with access only to projects they are
     * explicitly invited to
     */
    MEMBER = "MEMBER",
    /**
     * Platform operator with automatic access to all projects except (others' private projects) in the
     * platform but no platform administration capabilities
     */
    OPERATOR = "OPERATOR"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare const EmailType: import("@sinclair/typebox").TString;
export declare const PasswordType: import("@sinclair/typebox").TString;
export declare const User: import("@sinclair/typebox").TObject<{
    platformRole: import("@sinclair/typebox").TEnum<typeof PlatformRole>;
    status: import("@sinclair/typebox").TEnum<typeof UserStatus>;
    identityId: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    lastActiveDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type User = Static<typeof User>;
export declare const UserWithMetaInformation: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    email: import("@sinclair/typebox").TString;
    firstName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof UserStatus>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    platformRole: import("@sinclair/typebox").TEnum<typeof PlatformRole>;
    lastName: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    lastActiveDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type UserWithMetaInformation = Static<typeof UserWithMetaInformation>;
export declare const UserWithMetaInformationAndProject: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    email: import("@sinclair/typebox").TString;
    firstName: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof UserStatus>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    platformRole: import("@sinclair/typebox").TEnum<typeof PlatformRole>;
    lastName: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    trackEvents: import("@sinclair/typebox").TBoolean;
    newsLetter: import("@sinclair/typebox").TBoolean;
    verified: import("@sinclair/typebox").TBoolean;
    lastActiveDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type UserWithMetaInformationAndProject = Static<typeof UserWithMetaInformationAndProject>;
