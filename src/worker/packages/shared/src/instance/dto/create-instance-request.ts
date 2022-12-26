import { Static, Type } from "@sinclair/typebox";
import { CollectionId } from "../../collections/collection";
import { CollectionVersionId } from "../../collections/collection-version";
import { ID_LENGTH } from "../../common/id-generator";
import { InstanceStatus } from "../model";

export const CreateInstanceRequest = Type.Object({
    status: Type.Enum(InstanceStatus),
    collectionId: Type.String(),
    collectionVersionId: Type.String(),
});

export type CreateInstanceRequest = 
    Omit<Static<typeof CreateInstanceRequest>, "collectionId" | "collectionVersionId">
    & {
        collectionId: CollectionId;
        collectionVersionId: CollectionVersionId;
    };
