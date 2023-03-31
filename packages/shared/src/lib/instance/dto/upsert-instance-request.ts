import { Static, Type } from "@sinclair/typebox";
import { CollectionId } from "../../collections/collection";
import { InstanceStatus } from "../model";

export const UpsertInstanceRequest = Type.Object({
    collectionId: Type.String(),
    status: Type.Enum(InstanceStatus),
});

export type UpsertInstanceRequest =
    Omit<Static<typeof UpsertInstanceRequest>, "collectionId">
    & {
        collectionId: CollectionId;
    };

export const UpdateInstanceRequest = Type.Object({
    status: Type.Enum(InstanceStatus),
});

export type UpdateInstanceRequest = Static<typeof UpdateInstanceRequest>;
