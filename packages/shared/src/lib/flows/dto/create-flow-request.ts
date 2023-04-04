import { Static, Type } from "@sinclair/typebox";
import { CollectionId } from "../../collections/collection";

export const CreateFlowRequest = Type.Object({
    displayName: Type.String({}),
    collectionId: Type.String({})
});

export type CreateFlowRequest = Omit<Static<typeof CreateFlowRequest>,"collectionId"> & {collectionId: CollectionId};


export const GuessFlowRequest = Type.Object({
    prompt: Type.String({}),
    displayName: Type.String({}),
    collectionId: Type.String({}),
});

export type GuessFlowRequest = Static<typeof GuessFlowRequest>;
