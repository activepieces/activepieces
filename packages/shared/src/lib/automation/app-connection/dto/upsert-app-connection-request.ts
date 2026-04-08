import { z } from 'zod'
import { Metadata } from '../../../core/common/metadata'
import { AppConnectionScope, AppConnectionType } from '../app-connection'
import { OAuth2AuthorizationMethod } from '../oauth2-authorization-method'

const commonAuthProps = {
    externalId: z.string(),
    displayName: z.string(),
    pieceName: z.string(),
    projectId: z.string(),
    metadata: Metadata.optional(),
    pieceVersion: z.string().optional(),
}


export const BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE = 'both_client_credentials_and_authorization_code'

export enum OAuth2GrantType {
    AUTHORIZATION_CODE = 'authorization_code',
    CLIENT_CREDENTIALS = 'client_credentials',
}

const propsSchema = z.record(z.string(), z.unknown())
export const UpsertCustomAuthRequest = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.CUSTOM_AUTH),
    value: z.object({
        type: z.literal(AppConnectionType.CUSTOM_AUTH),
        props: propsSchema,
    }),
}).describe('Custom Auth')

export const UpsertNoAuthRequest = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.NO_AUTH),
    value: z.object({
        type: z.literal(AppConnectionType.NO_AUTH),
    }),
}).describe('No Auth')

const commonOAuth2ValueProps = {
    client_id: z.string().min(1),
    code: z.string().min(1),
    code_challenge: z.string().optional(),
    scope: z.string(),
    authorization_method: z.nativeEnum(OAuth2AuthorizationMethod).optional(),
}
export const UpsertPlatformOAuth2Request = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.PLATFORM_OAUTH2),
    value: z.object({
        ...commonOAuth2ValueProps,
        props: propsSchema.optional(),
        type: z.literal(AppConnectionType.PLATFORM_OAUTH2),
        redirect_url: z.string().min(1),
    }),
}).describe('Platform OAuth2')


export const UpsertCloudOAuth2Request = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.CLOUD_OAUTH2),
    value: z.object({
        ...commonOAuth2ValueProps,
        props: propsSchema.optional(),
        scope: z.string(),
        type: z.literal(AppConnectionType.CLOUD_OAUTH2),
    }),
}).describe('Cloud OAuth2')

export const UpsertSecretTextRequest = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.SECRET_TEXT),
    value: z.object({
        type: z.literal(AppConnectionType.SECRET_TEXT),
        secret_text: z.string().min(1),
    }),
}).describe('Secret Text')

export const UpsertOAuth2Request = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.OAUTH2),
    value: z.object({
        ...commonOAuth2ValueProps,
        client_secret: z.string().min(1),
        grant_type: z.nativeEnum(OAuth2GrantType).optional(),
        props: z.record(z.string(), z.any()).optional(),
        authorization_method: z.nativeEnum(OAuth2AuthorizationMethod).optional(),
        redirect_url: z.string().min(1),
        type: z.literal(AppConnectionType.OAUTH2),
    }),
}).describe('OAuth2')

export const UpsertBasicAuthRequest = z.object({
    ...commonAuthProps,
    type: z.literal(AppConnectionType.BASIC_AUTH),
    value: z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        type: z.literal(AppConnectionType.BASIC_AUTH),
    }),
}).describe('Basic Auth')

export const UpsertAppConnectionRequestBody = z.union([
    UpsertSecretTextRequest,
    UpsertOAuth2Request,
    UpsertCloudOAuth2Request,
    UpsertPlatformOAuth2Request,
    UpsertBasicAuthRequest,
    UpsertCustomAuthRequest,
    UpsertNoAuthRequest,
])

export type UpsertCloudOAuth2Request = z.infer<typeof UpsertCloudOAuth2Request>
export type UpsertPlatformOAuth2Request = z.infer<typeof UpsertPlatformOAuth2Request>
export type UpsertOAuth2Request = z.infer<typeof UpsertOAuth2Request>
export type UpsertSecretTextRequest = z.infer<typeof UpsertSecretTextRequest>
export type UpsertBasicAuthRequest = z.infer<typeof UpsertBasicAuthRequest>
export type UpsertCustomAuthRequest = z.infer<typeof UpsertCustomAuthRequest>
export type UpsertNoAuthRequest = z.infer<typeof UpsertNoAuthRequest>
export type UpsertAppConnectionRequestBody = z.infer<typeof UpsertAppConnectionRequestBody>


export const UpdateConnectionValueRequestBody = z.object({
    displayName: z.string().min(1),
    metadata: Metadata.optional(),
})

export const UpdateGlobalConnectionValueRequestBody = z.object({
    displayName: z.string().min(1),
    projectIds: z.array(z.string()).optional(),
    metadata: Metadata.optional(),
    preSelectForNewProjects: z.boolean().optional(),
})

export type UpdateConnectionValueRequestBody = z.infer<typeof UpdateConnectionValueRequestBody>
export type UpdateGlobalConnectionValueRequestBody = z.infer<typeof UpdateGlobalConnectionValueRequestBody>
const GlobalConnectionExtras = z.object({
    scope: z.literal(AppConnectionScope.PLATFORM),
    projectIds: z.array(z.string()),
    externalId: z.string().optional(),
    metadata: Metadata.optional(),
    preSelectForNewProjects: z.boolean().optional(),
})
export const UpsertGlobalConnectionRequestBody =
    z.union([
        UpsertSecretTextRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertOAuth2Request.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertCloudOAuth2Request.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertPlatformOAuth2Request.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertBasicAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertCustomAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
        UpsertNoAuthRequest.omit({ projectId: true, externalId: true }).merge(GlobalConnectionExtras),
    ])
export type UpsertGlobalConnectionRequestBody = z.infer<typeof UpsertGlobalConnectionRequestBody>

export const GetOAuth2AuthorizationUrlRequestBody = z.object({
    pieceName: z.string(),
    pieceVersion: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string(),
    redirectUrl: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
})
export type GetOAuth2AuthorizationUrlRequestBody = z.infer<typeof GetOAuth2AuthorizationUrlRequestBody>

export const GetOAuth2AuthorizationUrlResponse = z.object({
    authorizationUrl: z.string(),
    codeVerifier: z.string().optional(),
})
export type GetOAuth2AuthorizationUrlResponse = z.infer<typeof GetOAuth2AuthorizationUrlResponse>

export const ReplaceAppConnectionsRequestBody = z.object({
    sourceAppConnectionId: z.string(),
    targetAppConnectionId: z.string(),
    projectId: z.string(),
})
export type ReplaceAppConnectionsRequestBody = z.infer<typeof ReplaceAppConnectionsRequestBody>

export const ListFlowsFromAppConnectionRequestQuery = z.object({
    sourceAppConnectionIds: z.array(z.string()),
    projectId: z.string(),
})
export type ListFlowsFromAppConnectionRequestQuery = z.infer<typeof ListFlowsFromAppConnectionRequestQuery>
