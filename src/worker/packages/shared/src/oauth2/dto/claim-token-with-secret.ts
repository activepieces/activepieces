import { Static, Type } from "@sinclair/typebox";

export const ClaimTokenWithSecretRequest = Type.Object({
    tokenUrl: Type.String({}),
    clientId: Type.String({}),
    clientSecret: Type.String({}),
    redirectUrl: Type.String({}),
    code: Type.String({}),
});

export type ClaimTokenWithSecretRequest = Static<typeof ClaimTokenWithSecretRequest>;
