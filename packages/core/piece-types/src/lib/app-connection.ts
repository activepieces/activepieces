export enum AppConnectionType {
    OAUTH2 = 'OAUTH2',
    PLATFORM_OAUTH2 = 'PLATFORM_OAUTH2',
    CLOUD_OAUTH2 = 'CLOUD_OAUTH2',
    SECRET_TEXT = 'SECRET_TEXT',
    BASIC_AUTH = 'BASIC_AUTH',
    CUSTOM_AUTH = 'CUSTOM_AUTH',
    OIDC = 'OIDC',
    NO_AUTH = 'NO_AUTH',
}

export enum OAuth2GrantType {
    AUTHORIZATION_CODE = 'authorization_code',
    CLIENT_CREDENTIALS = 'client_credentials',
}

export const BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE = 'both_client_credentials_and_authorization_code'

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
    grant_type?: OAuth2GrantType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>
    props?: Record<string, unknown>
}

export type CustomAuthConnectionValue<T extends Record<string, unknown> = Record<string, unknown>> = {
    type: AppConnectionType.CUSTOM_AUTH
    props: T
    access_token?: string
    token_refresh_at?: number
}

export type OIDCConnectionValue<T extends Record<string, unknown> = Record<string, unknown>> = {
    type: AppConnectionType.OIDC
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

export type AppConnectionValue<
    T extends AppConnectionType = AppConnectionType,
    PropsType extends Record<string, unknown> = Record<string, unknown>
> =
    T extends AppConnectionType.SECRET_TEXT ? SecretTextConnectionValue :
        T extends AppConnectionType.BASIC_AUTH ? BasicAuthConnectionValue :
            T extends AppConnectionType.CLOUD_OAUTH2 ? CloudOAuth2ConnectionValue :
                T extends AppConnectionType.PLATFORM_OAUTH2 ? PlatformOAuth2ConnectionValue :
                    T extends AppConnectionType.OAUTH2 ? OAuth2ConnectionValueWithApp :
                        T extends AppConnectionType.CUSTOM_AUTH ? CustomAuthConnectionValue<PropsType> :
                            T extends AppConnectionType.OIDC ? OIDCConnectionValue<PropsType> :
                                T extends AppConnectionType.NO_AUTH ? NoAuthConnectionValue :
                                    never
