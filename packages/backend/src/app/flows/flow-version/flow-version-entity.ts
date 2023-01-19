import { EntitySchema } from "typeorm";
import { Flow, FlowVersion } from "@activepieces/shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../../helper/base-entity";

interface FlowVersionSchema extends FlowVersion {
  flow: Flow;
}

export const FlowVersionEntity = new EntitySchema<FlowVersionSchema>({
  name: "flow_version",
  columns: {
    ...BaseColumnSchemaPart,
    flowId: ApIdSchema,
    displayName: {
      type: String,
    },
    trigger: {
      type: "jsonb",
      nullable: true,
    },
    valid: {
      type: Boolean,
    },
    state: {
      type: String,
    },
  },
  indices: [
    {
      name: "idx_flow_version_flow_id",
      columns: ["flowId"],
      unique: false,
    },
  ],
  relations: {
    flow: {
      type: "many-to-one",
      target: "flow",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "flowId",
        foreignKeyConstraintName: "fk_flow_version_flow",
      },
    },
  },
});
