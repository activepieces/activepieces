import { Static, Type } from '@sinclair/typebox'
import { BaseModel, BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { UserMeta } from '../user'
import { OAuth2GrantType } from './dto/upsert-app-connection-request'
import { OAuth2AuthorizationMethod } from './oauth2-authorization-method'

export type AppConnectionId = string

export enum AppConnectionStatus {
    ACTIVE = 'ACTIVE',
    ERROR = 'ERROR',
}

export enum AppConnectionScope {
    PROJECT = 'PROJECT',
    PLATFORM = 'PLATFORM',
}

export enum AppConnectionType {
    OAUTH2 = 'OAUTH2',
    PLATFORM_OAUTH2 = 'PLATFORM_OAUTH2',
    CLOUD_OAUTH2 = 'CLOUD_OAUTH2',
    SECRET_TEXT = 'SECRET_TEXT',
    BASIC_AUTH = 'BASIC_AUTH',
    CUSTOM_AUTH = 'CUSTOM_AUTH',
}

export type SecretTextConnectionValue = {
    type: AppConnectionType.SECRET_TEXT
    secret_text: string
}
export type BasicAuthConnectionValue = {
    username: string
    password: string
    type: AppConnectionType.BASIC_AUTH
}

export type BaseOAuth2ConnectionValue = {
    expires_in?: number
    client_id: string
    token_type: string
    access_token: string
    claimed_at: number
    refresh_token: string
    scope: string
    token_url: string
    authorization_method?: OAuth2AuthorizationMethod
    data: Record<string, unknown>
    props?: Record<string, unknown>
    grant_type?: OAuth2GrantType
}

export type CustomAuthConnectionValue = {
    type: AppConnectionType.CUSTOM_AUTH
    props: Record<string, unknown>
}

export type CloudOAuth2ConnectionValue = {
    type: AppConnectionType.CLOUD_OAUTH2
} & BaseOAuth2ConnectionValue

export type PlatformOAuth2ConnectionValue = {
    type: AppConnectionType.PLATFORM_OAUTH2
    redirect_url: string
} & BaseOAuth2ConnectionValue

export type OAuth2ConnectionValueWithApp = {
    type: AppConnectionType.OAUTH2
    client_secret: string
    redirect_url: string
} & BaseOAuth2ConnectionValue

export type AppConnectionValue<T extends AppConnectionType = AppConnectionType> =
    T extends AppConnectionType.SECRET_TEXT ? SecretTextConnectionValue :
        T extends AppConnectionType.BASIC_AUTH ? BasicAuthConnectionValue :
            T extends AppConnectionType.CLOUD_OAUTH2 ? CloudOAuth2ConnectionValue :
                T extends AppConnectionType.PLATFORM_OAUTH2 ? PlatformOAuth2ConnectionValue :
                    T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp :
                        T extends AppConnectionType.CUSTOM_AUTH ? CustomAuthConnectionValue :
                            never

export type AppConnection<Type extends AppConnectionType = AppConnectionType> = BaseModel<AppConnectionId> & {
    externalId: string
    type: Type
    scope: AppConnectionScope
    pieceName: string
    displayName: string
    projectIds: string[]
    platformId: string
    status: AppConnectionStatus
    ownerId: string
    value: AppConnectionValue<Type>
}

export type OAuth2AppConnection = AppConnection<AppConnectionType.OAUTH2>
export type SecretKeyAppConnection = AppConnection<AppConnectionType.SECRET_TEXT>
export type CloudAuth2Connection = AppConnection<AppConnectionType.CLOUD_OAUTH2>
export type PlatformOAuth2Connection = AppConnection<AppConnectionType.PLATFORM_OAUTH2>
export type BasicAuthConnection = AppConnection<AppConnectionType.BASIC_AUTH>
export type CustomAuthConnection = AppConnection<AppConnectionType.CUSTOM_AUTH>

export const AppConnectionWithoutSensitiveData = Type.Object({
    ...BaseModelSchema,
    externalId: Type.String(),
    displayName: Type.String(),
    type: Type.Enum(AppConnectionType),
    pieceName: Type.String(),
    projectIds: Type.Array(ApId),
    platformId: Nullable(Type.String()),
    scope: Type.Enum(AppConnectionScope),
    status: Type.Enum(AppConnectionStatus),
    ownerId: Nullable(Type.String()),
    owner: Nullable(UserMeta),
}, {
    description: 'App connection is a connection to an external app.',
})
export type AppConnectionWithoutSensitiveData = Static<typeof AppConnectionWithoutSensitiveData> & { __brand: 'AppConnectionWithoutSensitiveData' }
