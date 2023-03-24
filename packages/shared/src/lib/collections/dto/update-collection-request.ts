import { Static, Type } from "@sinclair/typebox";

export const UpdateCollectionRequest = Type.Object({
    displayName: Type.String({}),
});

export type UpdateCollectionRequest = Static<typeof UpdateCollectionRequest>;
