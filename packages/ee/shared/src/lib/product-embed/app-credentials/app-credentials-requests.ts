import { Static, Type } from "@sinclair/typebox";
import { AppCredentialType } from "./app-credentials";

export const ListAppCredentialsRequest = Type.Object({
    projectId: Type.String(),
    appName: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String({})),
});


export type ListAppCredentialsRequest = Static<typeof ListAppCredentialsRequest>;

export const UpsertApiKeyCredentialRequest = Type.Object({
    id: Type.Optional(Type.String()),
    appName: Type.String(),
    settings: Type.Object({
        type: Type.Literal(AppCredentialType.API_KEY),
    }),
});


export const UpsertOAuth2CredentialRequest = Type.Object({
    id: Type.Optional(Type.String()),
    appName: Type.String(),
    settings: Type.Object({
        type: Type.Literal(AppCredentialType.OAUTH2),
        authUrl: Type.String({}),
        scope: Type.String(),
        tokenUrl: Type.String({}),
        clientId: Type.String({}),
        clientSecret: Type.String({})
    })
});

export const UpsertAppCredentialRequest = Type.Union([UpsertOAuth2CredentialRequest, UpsertApiKeyCredentialRequest]);

export type UpsertAppCredentialRequest = Static<typeof UpsertAppCredentialRequest>;