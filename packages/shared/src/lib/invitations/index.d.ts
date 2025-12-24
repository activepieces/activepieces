import { Static } from '@sinclair/typebox';
import { PlatformRole } from '../user/index';
export declare enum InvitationType {
    PLATFORM = "PLATFORM",
    PROJECT = "PROJECT"
}
export declare enum InvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED"
}
export declare const UserInvitation: import("@sinclair/typebox").TObject<{
    email: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof InvitationStatus>;
    type: import("@sinclair/typebox").TEnum<typeof InvitationType>;
    platformId: import("@sinclair/typebox").TString;
    platformRole: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<PlatformRole>>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    projectRoleId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    projectRole: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        userCount?: number;
        type: string;
        name: string;
        id: string;
        created: string;
        updated: string;
        permissions: string[];
    }>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type UserInvitation = Static<typeof UserInvitation>;
export declare const UserInvitationWithLink: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof InvitationType>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    status: import("@sinclair/typebox").TEnum<typeof InvitationStatus>;
    platformRole: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<PlatformRole>>;
    email: import("@sinclair/typebox").TString;
    projectRoleId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    projectRole: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        userCount?: number;
        type: string;
        name: string;
        id: string;
        created: string;
        updated: string;
        permissions: string[];
    }>>;
    link: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type UserInvitationWithLink = Static<typeof UserInvitationWithLink>;
export declare const SendUserInvitationRequest: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<InvitationType.PROJECT>;
    email: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    projectRole: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<InvitationType.PLATFORM>;
    email: import("@sinclair/typebox").TString;
    platformRole: import("@sinclair/typebox").TEnum<typeof PlatformRole>;
}>]>;
export type SendUserInvitationRequest = Static<typeof SendUserInvitationRequest>;
export declare const AcceptUserInvitationRequest: import("@sinclair/typebox").TObject<{
    invitationToken: import("@sinclair/typebox").TString;
}>;
export type AcceptUserInvitationRequest = Static<typeof AcceptUserInvitationRequest>;
export declare const ListUserInvitationsRequest: import("@sinclair/typebox").TObject<{
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TEnum<typeof InvitationType>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof InvitationStatus>>;
}>;
export type ListUserInvitationsRequest = Static<typeof ListUserInvitationsRequest>;
