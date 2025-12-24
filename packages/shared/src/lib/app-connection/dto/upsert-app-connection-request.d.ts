import { Static } from '@sinclair/typebox';
import { AppConnectionScope, AppConnectionType } from '../app-connection';
import { OAuth2AuthorizationMethod } from '../oauth2-authorization-method';
export declare const BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE = "both_client_credentials_and_authorization_code";
export declare enum OAuth2GrantType {
    AUTHORIZATION_CODE = "authorization_code",
    CLIENT_CREDENTIALS = "client_credentials"
}
export declare const UpsertCustomAuthRequest: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.CUSTOM_AUTH>;
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.CUSTOM_AUTH>;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertNoAuthRequest: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.NO_AUTH>;
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.NO_AUTH>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertPlatformOAuth2Request: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.PLATFORM_OAUTH2>;
    value: import("@sinclair/typebox").TObject<{
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.PLATFORM_OAUTH2>;
        redirect_url: import("@sinclair/typebox").TString;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        scope: import("@sinclair/typebox").TString;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertCloudOAuth2Request: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.CLOUD_OAUTH2>;
    value: import("@sinclair/typebox").TObject<{
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        scope: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.CLOUD_OAUTH2>;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertSecretTextRequest: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.SECRET_TEXT>;
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.SECRET_TEXT>;
        secret_text: import("@sinclair/typebox").TString;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertOAuth2Request: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.OAUTH2>;
    value: import("@sinclair/typebox").TObject<{
        client_secret: import("@sinclair/typebox").TString;
        grant_type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2GrantType>>;
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>>;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
        redirect_url: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.OAUTH2>;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        scope: import("@sinclair/typebox").TString;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertBasicAuthRequest: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.BASIC_AUTH>;
    value: import("@sinclair/typebox").TObject<{
        username: import("@sinclair/typebox").TString;
        password: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.BASIC_AUTH>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpsertAppConnectionRequestBody: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.SECRET_TEXT>;
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.SECRET_TEXT>;
        secret_text: import("@sinclair/typebox").TString;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.OAUTH2>;
    value: import("@sinclair/typebox").TObject<{
        client_secret: import("@sinclair/typebox").TString;
        grant_type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2GrantType>>;
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>>;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
        redirect_url: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.OAUTH2>;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        scope: import("@sinclair/typebox").TString;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.CLOUD_OAUTH2>;
    value: import("@sinclair/typebox").TObject<{
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        scope: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.CLOUD_OAUTH2>;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.PLATFORM_OAUTH2>;
    value: import("@sinclair/typebox").TObject<{
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.PLATFORM_OAUTH2>;
        redirect_url: import("@sinclair/typebox").TString;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        scope: import("@sinclair/typebox").TString;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.BASIC_AUTH>;
    value: import("@sinclair/typebox").TObject<{
        username: import("@sinclair/typebox").TString;
        password: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.BASIC_AUTH>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.CUSTOM_AUTH>;
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.CUSTOM_AUTH>;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.NO_AUTH>;
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.NO_AUTH>;
    }>;
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    pieceName: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>]>;
export type UpsertCloudOAuth2Request = Static<typeof UpsertCloudOAuth2Request>;
export type UpsertPlatformOAuth2Request = Static<typeof UpsertPlatformOAuth2Request>;
export type UpsertOAuth2Request = Static<typeof UpsertOAuth2Request>;
export type UpsertSecretTextRequest = Static<typeof UpsertSecretTextRequest>;
export type UpsertBasicAuthRequest = Static<typeof UpsertBasicAuthRequest>;
export type UpsertCustomAuthRequest = Static<typeof UpsertCustomAuthRequest>;
export type UpsertNoAuthRequest = Static<typeof UpsertNoAuthRequest>;
export type UpsertAppConnectionRequestBody = Static<typeof UpsertAppConnectionRequestBody>;
export declare const UpdateConnectionValueRequestBody: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
}>;
export declare const UpdateGlobalConnectionValueRequestBody: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    projectIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
}>;
export type UpdateConnectionValueRequestBody = Static<typeof UpdateConnectionValueRequestBody>;
export type UpdateGlobalConnectionValueRequestBody = Static<typeof UpdateGlobalConnectionValueRequestBody>;
export declare const UpsertGlobalConnectionRequestBody: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.SECRET_TEXT>;
        secret_text: import("@sinclair/typebox").TString;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.SECRET_TEXT>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        client_secret: import("@sinclair/typebox").TString;
        grant_type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2GrantType>>;
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>>;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
        redirect_url: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.OAUTH2>;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        scope: import("@sinclair/typebox").TString;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.OAUTH2>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        scope: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.CLOUD_OAUTH2>;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.CLOUD_OAUTH2>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        props: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.PLATFORM_OAUTH2>;
        redirect_url: import("@sinclair/typebox").TString;
        client_id: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
        code_challenge: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        scope: import("@sinclair/typebox").TString;
        authorization_method: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof OAuth2AuthorizationMethod>>;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.PLATFORM_OAUTH2>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        username: import("@sinclair/typebox").TString;
        password: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.BASIC_AUTH>;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.BASIC_AUTH>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.CUSTOM_AUTH>;
        props: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.CUSTOM_AUTH>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    value: import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<AppConnectionType.NO_AUTH>;
    }>;
    type: import("@sinclair/typebox").TLiteral<AppConnectionType.NO_AUTH>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>]>>;
    displayName: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TLiteral<AppConnectionScope.PLATFORM>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>]>;
export type UpsertGlobalConnectionRequestBody = Static<typeof UpsertGlobalConnectionRequestBody>;
export declare const ReplaceAppConnectionsRequestBody: import("@sinclair/typebox").TObject<{
    sourceAppConnectionId: import("@sinclair/typebox").TString;
    targetAppConnectionId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
}>;
export type ReplaceAppConnectionsRequestBody = Static<typeof ReplaceAppConnectionsRequestBody>;
export declare const ListFlowsFromAppConnectionRequestQuery: import("@sinclair/typebox").TObject<{
    sourceAppConnectionIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TString;
}>;
export type ListFlowsFromAppConnectionRequestQuery = Static<typeof ListFlowsFromAppConnectionRequestQuery>;
