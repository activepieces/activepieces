import { Static, Type } from "@sinclair/typebox";
import { ConnectionKeyType } from "./connection-key";

export const GetOrDeleteConnectionFromTokenRequest = Type.Object({
    projectId: Type.String(),
    token: Type.String(),
    appName: Type.String()
});

export type GetOrDeleteConnectionFromTokenRequest = Static<typeof GetOrDeleteConnectionFromTokenRequest>;


export const ListConnectionKeysRequest = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String({})),
});


export type ListConnectionKeysRequest = Static<typeof ListConnectionKeysRequest>;

export const UpsertConnectionFromToken = Type.Object({
    appCredentialId: Type.String(),
    props: Type.Record(Type.String(), Type.Any()),
    token: Type.String(),
    code: Type.String(),
    redirectUrl: Type.String()
});

export type UpsertConnectionFromToken = Static<typeof UpsertConnectionFromToken>

export const UpsertSigningKeyConnection = Type.Object({
    settings: Type.Object({
        type: Type.Literal(ConnectionKeyType.SIGNING_KEY)
    }),
});

export type UpsertSigningKeyConnection = Static<typeof UpsertSigningKeyConnection>