import { Static, Type } from "@sinclair/typebox";
import { AppAuthType, AuthAppName } from "../app-auth";

export const UpsertApiKeyAppRequest = Type.Object({
    name: Type.Union([]),
    projectId: Type.String({}),
    type: Type.Literal(AppAuthType.API_KEY),
    settings: Type.Object({}),
});

export const UpsertOAuth2AppRequest = Type.Object({
    name: Type.Union([Type.Literal(AuthAppName.SALESFORCE), 
        Type.Literal(AuthAppName.BLACKBAUD)]),
    projectId: Type.String({}),
    type: Type.Literal(AppAuthType.OAUTH2),
    settings: Type.Union([
        Type.Object({ code: Type.String({}) }),
        Type.Object({
            expires_in: Type.Optional(Type.Number()),
            claimed_at: Type.Optional(Type.Number()),
            refresh_token: Type.Optional(Type.String()),
            token_type: Type.String({}),
            access_token: Type.String({}),
            scope: Type.Array(Type.String({})),
            data: Type.Object({})
        })
    ])
});

export const UpsertAuthAppRequest = Type.Union([UpsertApiKeyAppRequest, UpsertOAuth2AppRequest]);

export type UpsertOAuth2AppRequest = Static<typeof UpsertOAuth2AppRequest>;
export type UpsertApiKeyAppRequest = Static<typeof UpsertApiKeyAppRequest>;
export type UpsertAuthAppRequest = Static<typeof UpsertAuthAppRequest>;