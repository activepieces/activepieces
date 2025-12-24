import { Static } from '@sinclair/typebox';
export declare const UserWithoutPassword: import("@sinclair/typebox").TObject<{
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    id: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof import("../../user/user").UserStatus>;
    platformRole: import("@sinclair/typebox").TEnum<typeof import("../../user/user").PlatformRole>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type UserWithoutPassword = Static<typeof UserWithoutPassword>;
export declare const AuthenticationResponse: import("@sinclair/typebox").TObject<{
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    id: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    status: import("@sinclair/typebox").TEnum<typeof import("../../user/user").UserStatus>;
    platformRole: import("@sinclair/typebox").TEnum<typeof import("../../user/user").PlatformRole>;
    email: import("@sinclair/typebox").TString;
    firstName: import("@sinclair/typebox").TString;
    lastName: import("@sinclair/typebox").TString;
    trackEvents: import("@sinclair/typebox").TBoolean;
    newsLetter: import("@sinclair/typebox").TBoolean;
    verified: import("@sinclair/typebox").TBoolean;
    projectId: import("@sinclair/typebox").TString;
    token: import("@sinclair/typebox").TString;
}>;
export type AuthenticationResponse = Static<typeof AuthenticationResponse>;
