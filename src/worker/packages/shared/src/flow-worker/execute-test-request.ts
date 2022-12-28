import { Static, Type } from "@sinclair/typebox";

export const ExecuteTestRequest = Type.Object({
    flowVersionId: Type.String(),
    collectionVersionId: Type.String({}),
    payload: Type.Object({})
});

export type ExecuteTestRequest = Static<typeof ExecuteTestRequest>;
