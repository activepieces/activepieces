import { Static, Type } from "@sinclair/typebox";

export const GetInstanceRequest = Type.Object({
    collectionId: Type.String(),
});

export type GetInstanceRequest = Static<typeof GetInstanceRequest>;
