import { Static, Type } from '@sinclair/typebox'
import { AppConnectionScope, AppConnectionType } from '../app-connection'
import { OAuth2AuthorizationMethod } from '../oauth2-authorization-method'

const commonAuthProps = {
    externalId: Type.String({}),
    displayName: Type.String({}),
    pieceName: Type.String({}),
    projectId: Type.String({}),
}

export enum OAuth2GrantType {
    AUTHORIZATION_CODE = 'authorization_code',
    CLIENT_CREDENTIALS = 'client_credentials',
}

export const UpsertCustomAuthRequest = Type.Object({
    ...commonAuthProps,
    type: Type.Literal(AppConnectionType.CUSTOM_AUTH),
    value: Type.Object({
        type: Type.Literal(AppConnectionType.CUSTOM_AUTH),
        props: Type.Record(Type.String(), Type.Unknown()),
    }),
}, {
    title: 'Custom Auth',
    description: 'Custom Auth',
})


const commonOAuth2ValueProps = {
    client_id: Type.String({
        minLength: 1,
    }),
    code: Type.String({
        minLength: 1,
    }),
    code_challenge: Type.Optional(Type.String({})),
    scope: Type.String(),
    authorization_method: Type.Optional(Type.Enum(OAuth2AuthorizationMethod)),
}
export const UpsertPlatformOAuth2Request = Type.Object({
    ...commonAuthProps,
    type: Type.Literal(AppConnectionType.PLATFORM_OAUTH2),
    value: Type.Object({
        ...commonOAuth2ValueProps,
        props: Type.Optional(Type.Record(Type.String(), Type.String())),
        type: Type.Literal(AppConnectionType.PLATFORM_OAUTH2),
        redirect_url: Type.String({
            minLength: 1,
        }),
    }),
}, {
    title: 'Platform OAuth2',
    description: 'Platform OAuth2',
})


export const UpsertCloudOAuth2Request = Type.Object({
    ...commonAuthProps,
    type: Type.Literal(AppConnectionType.CLOUD_OAUTH2),
    value: Type.Object({
        ...commonOAuth2ValueProps,
        props: Type.Optional(Type.Record(Type.String(), Type.String())),
        scope: Type.String(),
        type: Type.Literal(AppConnectionType.CLOUD_OAUTH2),
    }),
}, {
    title: 'Cloud OAuth2',
    description: 'Cloud OAuth2',
})

export const UpsertSecretTextRequest = Type.Object({
    ...commonAuthProps,
    type: Type.Literal(AppConnectionType.SECRET_TEXT),
    value: Type.Object({
        type: Type.Literal(AppConnectionType.SECRET_TEXT),
        secret_text: Type.String({
            minLength: 1,
        }),
    }),
}, {
    title: 'Secret Text',
    description: 'Secret Text',
})

export const UpsertOAuth2Request = Type.Object({
    ...commonAuthProps,
    type: Type.Literal(AppConnectionType.OAUTH2),
    value: Type.Object({
        ...commonOAuth2ValueProps,
        client_secret: Type.String({
            minLength: 1,
        }),
        grant_type: Type.Optional(Type.Enum(OAuth2GrantType)),
        props: Type.Optional(Type.Record(Type.String(), Type.Any())),
        authorization_method: Type.Optional(Type.Enum(OAuth2AuthorizationMethod)),
        redirect_url: Type.String({
            minLength: 1,
        }),
        type: Type.Literal(AppConnectionType.OAUTH2),
    }),
}, {
    title: 'OAuth2',
    description: 'OAuth2',
})

export const UpsertBasicAuthRequest = Type.Object({
    ...commonAuthProps,
    type: Type.Literal(AppConnectionType.BASIC_AUTH),
    value: Type.Object({
        username: Type.String({
            minLength: 1,
        }),
        password: Type.String({
            minLength: 1,
        }),
        type: Type.Literal(AppConnectionType.BASIC_AUTH),
    }),
}, {
    title: 'Basic Auth',
    description: 'Basic Auth',
})

export const UpsertAppConnectionRequestBody = Type.Union([
    UpsertSecretTextRequest,
    UpsertOAuth2Request,
    UpsertCloudOAuth2Request,
    UpsertPlatformOAuth2Request,
    UpsertBasicAuthRequest,
    UpsertCustomAuthRequest,
])

export type UpsertCloudOAuth2Request = Static<typeof UpsertCloudOAuth2Request>
export type UpsertPlatformOAuth2Request = Static<typeof UpsertPlatformOAuth2Request>
export type UpsertOAuth2Request = Static<typeof UpsertOAuth2Request>
export type UpsertSecretTextRequest = Static<typeof UpsertSecretTextRequest>
export type UpsertBasicAuthRequest = Static<typeof UpsertBasicAuthRequest>
export type UpsertCustomAuthRequest = Static<typeof UpsertCustomAuthRequest>
export type UpsertAppConnectionRequestBody = Static<typeof UpsertAppConnectionRequestBody>


export const UpdateConnectionValueRequestBody = Type.Object({
    displayName: Type.String({
        minLength: 1,
    }),
})

export const UpdateGlobalConnectionValueRequestBody = Type.Object({
    displayName: Type.String({
        minLength: 1,
    }),
    projectIds: Type.Optional(Type.Array(Type.String())),
})

export type UpdateConnectionValueRequestBody = Static<typeof UpdateConnectionValueRequestBody>
export type UpdateGlobalConnectionValueRequestBody = Static<typeof UpdateGlobalConnectionValueRequestBody>
export const UpsertGlobalConnectionRequestBody = Type.Composite([
    Type.Omit(UpsertAppConnectionRequestBody, ['projectId', 'externalId']),
    Type.Object({
        scope: Type.Literal(AppConnectionScope.PLATFORM),
        projectIds: Type.Array(Type.String()),
    }),
])

export type UpsertGlobalConnectionRequestBody = Static<typeof UpsertGlobalConnectionRequestBody>