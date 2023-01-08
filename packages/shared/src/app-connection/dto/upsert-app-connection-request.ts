import { Static, Type } from "@sinclair/typebox";
import { AuthAppName } from "../../app-auth/app-auth";

export const UpsertOAuth2ConnectionRequest = Type.Object({
    appName: Type.Union([Type.Literal(AuthAppName.SALESFORCE), Type.Literal(AuthAppName.BLACKBAUD)]),
    projectId: Type.String({}),
    settings: Type.Object({
        clientId: Type.String({}),
        clientSecret: Type.String({}),
        scope: Type.String({}),
    }),
});

export const UpsertAuthAppRequest = Type.Union([UpsertOAuth2ConnectionRequest]);
export type UpsertAuthAppRequest = Static<typeof UpsertAuthAppRequest>;