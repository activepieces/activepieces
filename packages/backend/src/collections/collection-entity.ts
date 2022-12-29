import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";
import { Collection, CollectionVersion, Flow, Project } from "shared";

export interface CollectionSchema extends Collection {
  project: Project;
  flows: Flow[];
  versions: CollectionVersion[];
}

export const CollectionEntity = new EntitySchema<CollectionSchema>({
  name: "collection",
  columns: {
    ...BaseColumnSchemaPart,
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
    versions: {
      type: "one-to-many",
      target: "collection_version",
      inverseSide: "collection",
    },
    flows: {
      type: "one-to-many",
      target: "flow",
      inverseSide: "collection",
    },
  },
});
