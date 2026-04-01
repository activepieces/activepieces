import { z } from 'zod'
import { BaseModel, BaseModelSchema, Nullable } from '../../core/common/base-model'
import { ApId } from '../../core/common/id-generator'
import { Metadata } from '../../core/common/metadata'
import { UserWithMetaInformation } from '../../core/user'
import { OAuth2GrantType } from './dto/upsert-app-connection-request'
import { OAuth2AuthorizationMethod } from './oauth2-authorization-method'

export type AppConnectionId = string

export enum AppConnectionStatus {
    ACTIVE = 'ACTIVE',
    MISSING = 'MISSING',
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
    NO_AUTH = 'NO_AUTH',
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>
    props?: Record<string, unknown>
    grant_type?: OAuth2GrantType
}

export type CustomAuthConnectionValue<T extends Record<string, unknown> = Record<string, unknown>> = {
    type: AppConnectionType.CUSTOM_AUTH
    props: T
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

export type NoAuthConnectionValue = {
    type: AppConnectionType.NO_AUTH
}

export type AppConnectionValue<T extends AppConnectionType = AppConnectionType, PropsType extends Record<string, unknown> = Record<string, unknown>> =
    T extends AppConnectionType.SECRET_TEXT ? SecretTextConnectionValue :
        T extends AppConnectionType.BASIC_AUTH ? BasicAuthConnectionValue :
            T extends AppConnectionType.CLOUD_OAUTH2 ? CloudOAuth2ConnectionValue :
                T extends AppConnectionType.PLATFORM_OAUTH2 ? PlatformOAuth2ConnectionValue :
                    T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp :
                        T extends AppConnectionType.CUSTOM_AUTH ? CustomAuthConnectionValue<PropsType> :
                            T extends AppConnectionType.NO_AUTH ? NoAuthConnectionValue :
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
    owner: UserWithMetaInformation | null
    value: AppConnectionValue<Type>
    metadata: Metadata | null
    pieceVersion: string
    preSelectForNewProjects: boolean
}

export type OAuth2AppConnection = AppConnection<AppConnectionType.OAUTH2>
export type SecretKeyAppConnection = AppConnection<AppConnectionType.SECRET_TEXT>
export type CloudAuth2Connection = AppConnection<AppConnectionType.CLOUD_OAUTH2>
export type PlatformOAuth2Connection = AppConnection<AppConnectionType.PLATFORM_OAUTH2>
export type BasicAuthConnection = AppConnection<AppConnectionType.BASIC_AUTH>
export type CustomAuthConnection = AppConnection<AppConnectionType.CUSTOM_AUTH>
export type NoAuthConnection = AppConnection<AppConnectionType.NO_AUTH>

export const AppConnectionWithoutSensitiveData = z.object({
    ...BaseModelSchema,
    externalId: z.string(),
    displayName: z.string(),
    type: z.nativeEnum(AppConnectionType),
    pieceName: z.string(),
    projectIds: z.array(ApId),
    platformId: Nullable(z.string()),
    scope: z.nativeEnum(AppConnectionScope),
    status: z.nativeEnum(AppConnectionStatus),
    ownerId: Nullable(z.string()),
    owner: Nullable(UserWithMetaInformation),
    metadata: Nullable(Metadata),
    flowIds: Nullable(z.array(ApId)),
    pieceVersion: z.string(),
    preSelectForNewProjects: z.boolean(),
    usingSecretManager: z.boolean(),
}).describe('App connection is a connection to an external app.')
export type AppConnectionWithoutSensitiveData = z.infer<typeof AppConnectionWithoutSensitiveData>

export const AppConnectionOwners = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
})

export type AppConnectionOwners = z.infer<typeof AppConnectionOwners>
/**i.e props: {projectId: "123"} and value: "{{projectId}}" will return "123" */
export const resolveValueFromProps = (props: Record<string, unknown> | undefined, value: string)=>{
    let resolvedScope = value
    if (!props) {
        return resolvedScope
    }
    Object.entries(props).forEach(([key, value]) => {
        resolvedScope = resolvedScope.replace(`{${key}}`, String(value))
    })
    return resolvedScope
}
