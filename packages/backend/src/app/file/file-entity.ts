import { EntitySchema } from "typeorm";
import { BaseColumnSchemaPart } from "../helper/base-entity";
import { File } from "@activepieces/shared";

interface FileSchema extends File {}

export const FileEntity = new EntitySchema<FileSchema>({
  name: "file",
  columns: {
    ...BaseColumnSchemaPart,
    data: {
      type: "bytea",
      nullable: false,
    },
  },
});
