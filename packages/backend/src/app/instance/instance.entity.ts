import { EntitySchema} from "typeorm";
import { Collection, Instance } from "@activepieces/shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";
export interface InstanceSchema extends Instance {
  collection: Collection;
}

export const InstanceEntity = new EntitySchema<InstanceSchema>({
    name: "instance",
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        collectionId: ApIdSchema,
        flowIdToVersionId: {
            type: "jsonb",
        },
        status: {
            type: String,
        },
    },
    indices: [
        {
            name: "idx_instance_project_id",
            columns: ["projectId"],
            unique: false,
        },
        {
            name: "idx_instance_collection_id",
            columns: ["collectionId"],
            unique: true,
        },
    ],
    relations: {
        collection: {
            type: "one-to-one",
            target: "collection",
            cascade: true,
            onDelete: "CASCADE",
            joinColumn: {
                name: "collectionId",
                referencedColumnName: "id",
                foreignKeyConstraintName: "fk_instance_collection",
            },
        },
    },
});
