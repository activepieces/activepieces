import { EntitySchema } from "typeorm";
import { Collection, Flow, FlowVersion } from "shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

interface FlowSchema extends Flow {
  versions: FlowVersion[];
  collection: Collection;
}

export const FlowEntity = new EntitySchema<FlowSchema>({
  name: "flow",
  columns: {
    ...BaseColumnSchemaPart,
    collectionId: ApIdSchema,
  },
  indices: [
    {
      name: "idx_flow_collection_id",
      columns: ["collectionId"],
      unique: false,
    },
  ],
  relations: {
    versions: {
      type: "one-to-many",
      target: "flow_version",
      inverseSide: "flow",
    },
    collection: {
      type: "many-to-one",
      target: "collection",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "collectionId",
        foreignKeyConstraintName: "fk_flow_collection_id",
      },
    },
  },
});
