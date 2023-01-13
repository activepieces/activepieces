import { Static, Type } from "@sinclair/typebox";
import {CollectionId} from "../../collections/collection";

export const CreateFlowRequest = Type.Object({
    displayName: Type.String({}),
    collectionId: Type.String({})
});

export type CreateFlowRequest = Static<typeof CreateFlowRequest>;
