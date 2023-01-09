import { Static, Type } from "@sinclair/typebox";

export const UpsertOAuth2AppCredentialsRequest = Type.Object({
    name: Type.String({}),
    projectId: Type.String({}),
    settings: Type.Object({
        clientId: Type.String({}),
        clientSecret: Type.String({}),
        scope: Type.String({}),
    }),
});

export const UpsertAppCredentialsRequest = Type.Union([UpsertOAuth2AppCredentialsRequest]);
export type UpsertAppCredentialsRequest = Static<typeof UpsertAppCredentialsRequest>;