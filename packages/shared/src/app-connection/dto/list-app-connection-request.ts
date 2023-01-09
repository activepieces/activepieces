import { Static, Type } from "@sinclair/typebox";

export const ListAppConnectionRequest = Type.Object({
    cursor: Type.String({}),
    appCredentialId: Type.String({}),
    limit: Type.Number({})
});
export type ListAppConnectionRequest = Static<typeof ListAppConnectionRequest>;
