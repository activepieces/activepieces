import { ApId, BaseModelSchema, DateOrString, Nullable, OptionalArrayFromQuery } from '@activepieces/core-utils'
import { z } from 'zod'
import { AppConnectionType } from '../../automation/app-connection/app-connection'
import { UpsertAppConnectionRequestBody } from '../../automation/app-connection/dto/upsert-app-connection-request'

export const ConnectOAuth2App = z.object({
    oauth2Type: z.union([
        z.literal(AppConnectionType.CLOUD_OAUTH2),
        z.literal(AppConnectionType.PLATFORM_OAUTH2),
        z.literal(AppConnectionType.OAUTH2),
    ]),
    clientId: z.string().nullable(),
})
export type ConnectOAuth2App = z.infer<typeof ConnectOAuth2App>

export const CreateOrGetSdkProjectRequest = z.object({
    externalId: z.string(),
})
export type CreateOrGetSdkProjectRequest = z.infer<typeof CreateOrGetSdkProjectRequest>

export const RunSdkActionRequest = z.object({
    projectId: z.string(),
    pieceName: z.string(),
    pieceVersion: z.string().optional(),
    actionName: z.string(),
    input: z.record(z.string(), z.unknown()).optional(),
    connectionExternalId: z.string().optional(),
})
export type RunSdkActionRequest = z.infer<typeof RunSdkActionRequest>

export const GetSdkPiecePropsRequest = z.object({
    projectId: z.string(),
    pieceName: z.string(),
    actionOrTriggerName: z.string(),
    type: z.enum(['action', 'trigger']),
    auth: z.string().optional(),
    input: z.record(z.string(), z.unknown()).optional(),
})
export type GetSdkPiecePropsRequest = z.infer<typeof GetSdkPiecePropsRequest>

export const CreateConnectLinkRequest = z.object({
    projectId: z.string(),
    pieceName: z.string(),
    externalId: z.string(),
    displayName: z.string().optional(),
})
export type CreateConnectLinkRequest = z.infer<typeof CreateConnectLinkRequest>

export const CreateConnectLinkResponse = z.object({
    redirectUrl: z.string(),
    externalId: z.string(),
    expiresAt: z.string(),
})
export type CreateConnectLinkResponse = z.infer<typeof CreateConnectLinkResponse>

export const ExchangeConnectTokenRequest = z.object({
    token: z.string(),
})
export type ExchangeConnectTokenRequest = z.infer<typeof ExchangeConnectTokenRequest>

export const WebsiteBrand = z.object({
    websiteName: z.string(),
    logos: z.object({
        fullLogoUrl: z.string(),
        favIconUrl: z.string(),
        logoIconUrl: z.string(),
    }),
    colors: z.object({
        avatar: z.string(),
        'blue-link': z.string(),
        danger: z.string(),
        selection: z.string(),
        primary: z.object({
            default: z.string(),
            dark: z.string(),
            light: z.string(),
            medium: z.string(),
        }),
        warn: z.object({
            default: z.string(),
            light: z.string(),
            dark: z.string(),
        }),
        success: z.object({
            default: z.string(),
            light: z.string(),
        }),
    }),
})
export type WebsiteBrand = z.infer<typeof WebsiteBrand>

export const ExchangeConnectTokenResponse = z.object({
    platformId: z.string(),
    projectId: z.string(),
    pieceName: z.string(),
    externalId: z.string(),
    displayName: z.string().nullable(),
    oauth2App: ConnectOAuth2App.nullable(),
    theme: WebsiteBrand,
})
export type ExchangeConnectTokenResponse = z.infer<typeof ExchangeConnectTokenResponse>

export const SaveConnectConnectionRequest = z.object({
    token: z.string(),
    connection: UpsertAppConnectionRequestBody,
})
export type SaveConnectConnectionRequest = z.infer<typeof SaveConnectConnectionRequest>

export const ConnectOAuth2UrlRequest = z.object({
    token: z.string(),
    clientId: z.string(),
    redirectUrl: z.string(),
    pieceVersion: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    props: z.record(z.string(), z.unknown()).optional(),
})
export type ConnectOAuth2UrlRequest = z.infer<typeof ConnectOAuth2UrlRequest>

export enum PieceRunStatus {
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export const PieceRun = z.object({
    ...BaseModelSchema,
    projectId: ApId,
    platformId: ApId,
    pieceName: z.string(),
    pieceVersion: z.string(),
    actionName: z.string(),
    connectionExternalId: Nullable(z.string()),
    input: z.record(z.string(), z.unknown()),
    output: Nullable(z.unknown()),
    status: z.nativeEnum(PieceRunStatus),
    errorMessage: Nullable(z.string()),
    startTime: DateOrString,
    finishTime: Nullable(DateOrString),
})
export type PieceRun = z.infer<typeof PieceRun>

export const ListPieceRunsRequestQuery = z.object({
    projectId: ApId,
    pieceName: z.string().optional(),
    status: OptionalArrayFromQuery(z.nativeEnum(PieceRunStatus)),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})
export type ListPieceRunsRequestQuery = z.infer<typeof ListPieceRunsRequestQuery>
