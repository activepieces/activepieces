import { Static, Type } from "@sinclair/typebox";

export const ListAppConnectionRequest = Type.Object({
    cursor: Type.Optional(Type.String({})),
    projectId: Type.String({}),
    appName: Type.Optional(Type.String({})),
    limit: Type.Optional(Type.Number({}))
});
export type ListAppConnectionRequest = Static<typeof ListAppConnectionRequest>;

export const getAppConnectionRequest = Type.Object({
    projectId: Type.String({})
});
export type getAppConnectionRequest = Static<typeof getAppConnectionRequest>;
