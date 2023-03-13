import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";
import { Collection, Flow, Project } from "@activepieces/shared";

export interface CollectionSchema extends Collection {
  project: Project;
  flows: Flow[];
}

export const CollectionEntity = new EntitySchema<CollectionSchema>({
    name: "collection",
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String,
            // TODO REMOVE IN FUTURE
            nullable: true
        },
        projectId: ApIdSchema,
    },
    indices: [
        {
            name: "idx_collection_project_id",
            columns: ["projectId"],
            unique: false,
        },
    ],
    relations: {
        project: {
            type: "many-to-one",
            target: "project",
            cascade: true,
            onDelete: "CASCADE",
            joinColumn: {
                name: "projectId",
                foreignKeyConstraintName: "fk_collection_project_id",
            },
        },
        flows: {
            type: "one-to-many",
            target: "flow",
            inverseSide: "collection",
        },
    },
});
