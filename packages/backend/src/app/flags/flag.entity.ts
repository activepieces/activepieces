import { EntitySchema } from "typeorm";
import { BaseColumnSchemaPart } from "../helper/base-entity";
import { Flag } from "@activepieces/shared";

interface FlagSchema extends Flag {}

export const FlagEntity = new EntitySchema<FlagSchema>({
  name: "flag",
  columns: {
    ...BaseColumnSchemaPart,
    value: {
      type: "jsonb",
    },
  },
  indices: [],
  relations: {},
});
