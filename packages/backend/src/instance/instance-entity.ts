import { EntitySchema } from "typeorm";
import { Collection, CollectionVersion, Instance } from "shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

export interface InstanceSchema extends Instance {
  collection: Collection;
  collectionVersion: CollectionVersion;
}

export const InstanceEntity = new EntitySchema<InstanceSchema>({
  name: "instance",
  columns: {
    ...BaseColumnSchemaPart,
    projectId: ApIdSchema,
    collectionId: ApIdSchema,
    collectionVersionId: ApIdSchema,
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
    collectionVersion: {
      type: "one-to-one",
      target: "collection_version",
      joinColumn: {
        name: "collectionVersionId",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_instance_collection_version",
      },
    },
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
