import { Static, Type } from "@sinclair/typebox";
import { AppConnectionType } from "../app-connection";

const OAuth2Response = Type.Object({
    expires_in: Type.Optional(Type.Number()),
    claimed_at: Type.Optional(Type.Number()),
    refresh_token: Type.Optional(Type.String()),
    token_type: Type.String({}),
    access_token: Type.String({}),
    scope: Type.Array(Type.String({})),
    data: Type.Object({})
});

const UpsertCloudOAuth2Request = Type.Object({
    name: Type.String({}),
    appName: Type.String({}),
    projectId: Type.String({}),
    type: Type.Union([Type.Literal(AppConnectionType.CLOUD_OAUTH2)]),
    connection: OAuth2Response
});

const UpsertApiKeyRequest = Type.Object({
    name: Type.String({}),
    appName: Type.String({}),
    projectId: Type.String({}),
    type: Type.Union([Type.Literal(AppConnectionType.API_KEY)]),
    connection: Type.Object({
        api_key: Type.String({})
    })
});

const UpsertOAuth2Request = Type.Object({
    name: Type.String({}),
    appName: Type.String({}),
    projectId: Type.String({}),
    settings: Type.Object({
        clientId: Type.String({}),
        clientSecret: Type.String({}),
        tokenUrl: Type.String({}),
        redirectUrl: Type.String({})
    }),
    type: Type.Union([Type.Literal(AppConnectionType.OAUTH2)]),
    connection: OAuth2Response
});

export const UpsertConnectionRequest = Type.Union([UpsertCloudOAuth2Request, UpsertOAuth2Request, UpsertApiKeyRequest]);
export type UpsertConnectionRequest = Static<typeof UpsertConnectionRequest>;