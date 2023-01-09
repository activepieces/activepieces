import { Static, Type } from "@sinclair/typebox";
import { AppSecretType } from "../app-credential";

export const UpsertOAuth2AppCredentialsRequest = Type.Object({
    name: Type.String({}),
    projectId: Type.String({}),
    type: Type.Literal(AppSecretType.OAUTH2),
    settings: Type.Object({
        clientId: Type.String({}),
        clientSecret: Type.String({}),
        tokenUrl: Type.String({}),
        redirectUrl: Type.String({})
    }),
});

export const UpsertApiKeyAppCredentialsRequest = Type.Object({
    name: Type.String({}),
    projectId: Type.String({}),
    type: Type.Literal(AppSecretType.API_KEY),
    settings: Type.Object({}),
});

export const UpsertCloudAuthCredentialsRequests = Type.Object({
    name: Type.String({}),
    projectId: Type.String({}),
    type: Type.Literal(AppSecretType.CLOUD_OAUTH2),
    settings: Type.Object({}),
});


export const UpsertAppCredentialsRequest = Type.Union([UpsertCloudAuthCredentialsRequests, UpsertApiKeyAppCredentialsRequest, UpsertOAuth2AppCredentialsRequest]);
export type UpsertAppCredentialsRequest = Static<typeof UpsertAppCredentialsRequest>;