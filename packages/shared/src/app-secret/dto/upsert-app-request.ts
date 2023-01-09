import { Static, Type } from "@sinclair/typebox";
import { AppName } from "../app-secret";

export const UpsertOAuth2AppSecretRequest = Type.Object({
    name: Type.Union([Type.Literal(AppName.SALESFORCE), Type.Literal(AppName.BLACKBAUD)]),
    projectId: Type.String({}),
    settings: Type.Object({
        clientId: Type.String({}),
        clientSecret: Type.String({}),
        scope: Type.String({}),
    }),
});

export const UpsertAppSecretRequest = Type.Union([UpsertOAuth2AppSecretRequest]);
export type UpsertAppSecretRequest = Static<typeof UpsertAppSecretRequest>;