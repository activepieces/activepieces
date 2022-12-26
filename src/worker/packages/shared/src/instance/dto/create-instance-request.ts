import { Static, Type } from "@sinclair/typebox";
import { CollectionId } from "../../collections/collection";
import { CollectionVersionId } from "../../collections/collection-version";
import { InstanceStatus } from "../model";

export const CreateInstanceRequest = Type.Object({
    collectionId: Type.String(),
    status: Type.Enum(InstanceStatus),
});

export type CreateInstanceRequest = 
    Omit<Static<typeof CreateInstanceRequest>, "collectionId">
    & {
        collectionId: CollectionId;
    };
