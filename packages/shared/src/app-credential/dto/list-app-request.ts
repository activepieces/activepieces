import { Static, Type } from "@sinclair/typebox";

export const ListAppRequest = Type.Object({
    cursor: Type.String({}),
    projectId: Type.String({}),
    limit: Type.Number({})
});
export type ListAppRequest = Static<typeof ListAppRequest>;
