import { Static } from '@sinclair/typebox';
import { BaseModel } from '../common/base-model';
import { Metadata } from '../common/metadata';
import { UserWithMetaInformation } from '../user';
import { OAuth2GrantType } from './dto/upsert-app-connection-request';
import { OAuth2AuthorizationMethod } from './oauth2-authorization-method';
export type AppConnectionId = string;
export declare enum AppConnectionStatus {
    ACTIVE = "ACTIVE",
    MISSING = "MISSING",
    ERROR = "ERROR"
}
export declare enum AppConnectionScope {
    PROJECT = "PROJECT",
    PLATFORM = "PLATFORM"
}
export declare enum AppConnectionType {
    OAUTH2 = "OAUTH2",
    PLATFORM_OAUTH2 = "PLATFORM_OAUTH2",
    CLOUD_OAUTH2 = "CLOUD_OAUTH2",
    SECRET_TEXT = "SECRET_TEXT",
    BASIC_AUTH = "BASIC_AUTH",
    CUSTOM_AUTH = "CUSTOM_AUTH",
    NO_AUTH = "NO_AUTH"
}
export type SecretTextConnectionValue = {
    type: AppConnectionType.SECRET_TEXT;
    secret_text: string;
};
export type BasicAuthConnectionValue = {
    username: string;
    password: string;
    type: AppConnectionType.BASIC_AUTH;
};
export type BaseOAuth2ConnectionValue = {
    expires_in?: number;
    client_id: string;
    token_type: string;
    access_token: string;
    claimed_at: number;
    refresh_token: string;
    scope: string;
    token_url: string;
    authorization_method?: OAuth2AuthorizationMethod;
    data: Record<string, any>;
    props?: Record<string, unknown>;
    grant_type?: OAuth2GrantType;
};
export type CustomAuthConnectionValue<T extends Record<string, unknown> = Record<string, unknown>> = {
    type: AppConnectionType.CUSTOM_AUTH;
    props: T;
};
export type CloudOAuth2ConnectionValue = {
    type: AppConnectionType.CLOUD_OAUTH2;
} & BaseOAuth2ConnectionValue;
export type PlatformOAuth2ConnectionValue = {
    type: AppConnectionType.PLATFORM_OAUTH2;
    redirect_url: string;
} & BaseOAuth2ConnectionValue;
export type OAuth2ConnectionValueWithApp = {
    type: AppConnectionType.OAUTH2;
    client_secret: string;
    redirect_url: string;
} & BaseOAuth2ConnectionValue;
export type NoAuthConnectionValue = {
    type: AppConnectionType.NO_AUTH;
};
export type AppConnectionValue<T extends AppConnectionType = AppConnectionType, PropsType extends Record<string, unknown> = Record<string, unknown>> = T extends AppConnectionType.SECRET_TEXT ? SecretTextConnectionValue : T extends AppConnectionType.BASIC_AUTH ? BasicAuthConnectionValue : T extends AppConnectionType.CLOUD_OAUTH2 ? CloudOAuth2ConnectionValue : T extends AppConnectionType.PLATFORM_OAUTH2 ? PlatformOAuth2ConnectionValue : T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp : T extends AppConnectionType.CUSTOM_AUTH ? CustomAuthConnectionValue<PropsType> : T extends AppConnectionType.NO_AUTH ? NoAuthConnectionValue : never;
export type AppConnection<Type extends AppConnectionType = AppConnectionType> = BaseModel<AppConnectionId> & {
    externalId: string;
    type: Type;
    scope: AppConnectionScope;
    pieceName: string;
    displayName: string;
    projectIds: string[];
    platformId: string;
    status: AppConnectionStatus;
    ownerId: string;
    owner: UserWithMetaInformation | null;
    value: AppConnectionValue<Type>;
    metadata: Metadata | null;
    pieceVersion: string;
};
export type OAuth2AppConnection = AppConnection<AppConnectionType.OAUTH2>;
export type SecretKeyAppConnection = AppConnection<AppConnectionType.SECRET_TEXT>;
export type CloudAuth2Connection = AppConnection<AppConnectionType.CLOUD_OAUTH2>;
export type PlatformOAuth2Connection = AppConnection<AppConnectionType.PLATFORM_OAUTH2>;
export type BasicAuthConnection = AppConnection<AppConnectionType.BASIC_AUTH>;
export type CustomAuthConnection = AppConnection<AppConnectionType.CUSTOM_AUTH>;
export type NoAuthConnection = AppConnection<AppConnectionType.NO_AUTH>;
export declare const AppConnectionWithoutSensitiveData: import("@sinclair/typebox").TObject<{
    externalId: import("@sinclair/typebox").TString;
    displayName: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TEnum<typeof AppConnectionType>;
    pieceName: import("@sinclair/typebox").TString;
    projectIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    scope: import("@sinclair/typebox").TEnum<typeof AppConnectionScope>;
    status: import("@sinclair/typebox").TEnum<typeof AppConnectionStatus>;
    ownerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    owner: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        externalId?: string;
        lastActiveDate?: string;
        id: string;
        created: string;
        updated: string;
        status: import("../user").UserStatus;
        email: string;
        platformRole: import("../user").PlatformRole;
        firstName: string;
        lastName: string;
    }>>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    flowIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string[]>>;
    pieceVersion: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type AppConnectionWithoutSensitiveData = Static<typeof AppConnectionWithoutSensitiveData> & {
    __brand: 'AppConnectionWithoutSensitiveData';
};
export declare const AppConnectionOwners: import("@sinclair/typebox").TObject<{
    firstName: import("@sinclair/typebox").TString;
    lastName: import("@sinclair/typebox").TString;
    email: import("@sinclair/typebox").TString;
}>;
export type AppConnectionOwners = Static<typeof AppConnectionOwners>;
/**i.e props: {projectId: "123"} and value: "{{projectId}}" will return "123" */
export declare const resolveValueFromProps: (props: Record<string, unknown> | undefined, value: string) => string;
