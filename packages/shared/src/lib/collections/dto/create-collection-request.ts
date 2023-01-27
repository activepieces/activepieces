import { Static, Type } from "@sinclair/typebox";

export const CreateCollectionRequest = Type.Object({
    displayName: Type.String({}),
});

export type CreateCollectionRequest = Static<typeof CreateCollectionRequest>;

