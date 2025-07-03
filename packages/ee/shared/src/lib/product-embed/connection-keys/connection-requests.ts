import { Static, Type } from '@sinclair/typebox'
import { ConnectionKeyType } from './connection-key'

export const GetOrDeleteConnectionFromTokenRequest = Type.Object({
    projectId: Type.String(),
    token: Type.String(),
    appName: Type.String(),
})

export type GetOrDeleteConnectionFromTokenRequest = Static<typeof GetOrDeleteConnectionFromTokenRequest>


export const ListConnectionKeysRequest = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String({})),
})


export type ListConnectionKeysRequest = Static<typeof ListConnectionKeysRequest>

export const UpsertApiKeyConnectionFromToken = Type.Object({
    appCredentialId: Type.String(),
    apiKey: Type.String(),
    token: Type.String(),
})

export type UpsertApiKeyConnectionFromToken = Static<typeof UpsertApiKeyConnectionFromToken>

export const UpsertOAuth2ConnectionFromToken = Type.Object({
    appCredentialId: Type.String(),
    props: Type.Record(Type.String(), Type.Any()),
    token: Type.String(),
    code: Type.String(),
    redirectUrl: Type.String(),
})

export type UpsertOAuth2ConnectionFromToken = Static<typeof UpsertOAuth2ConnectionFromToken>

export const UpsertConnectionFromToken = Type.Union([UpsertApiKeyConnectionFromToken, UpsertOAuth2ConnectionFromToken])

export type UpsertConnectionFromToken = Static<typeof UpsertConnectionFromToken>

export const UpsertSigningKeyConnection = Type.Object({
    settings: Type.Object({
        type: Type.Literal(ConnectionKeyType.SIGNING_KEY),
    }),
})

export type UpsertSigningKeyConnection = Static<typeof UpsertSigningKeyConnection>