import { Static, Type } from "@sinclair/typebox";

export const CreateFlowRunRequest = Type.Object({
    flowVersionId: Type.String(),
    collectionVersionId: Type.String(),
    payload: Type.Object({})
});

export type CreateFlowRunRequest = Static<typeof CreateFlowRunRequest>;
