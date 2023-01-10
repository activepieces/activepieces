import { Static, Type } from "@sinclair/typebox";

export const UpsertConnectionRequest = Type.Object({
    name: Type.String({}),
    appCredentialId: Type.String({}),
    connection: Type.Any([
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
export type UpsertConnectionRequest = Static<typeof UpsertConnectionRequest>;