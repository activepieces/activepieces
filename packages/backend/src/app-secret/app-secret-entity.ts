import { Project, AppSecret, AppConnection } from "shared";
import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

export interface AppSecretSchema extends AppSecret {
  project: Project;
  appConnections: AppConnection[];
}

export const AppSecretEntity = new EntitySchema<AppSecretSchema>({
  name: "app_secret",
  columns: {
    ...BaseColumnSchemaPart,
    name: {
      type: String,
    },
    type: {
      type: String
    },
    projectId: ApIdSchema,
    settings: {
      type: "jsonb"
    }
  },
  indices: [
    {
      name: "idx_app_secret_project_id_name",
      columns: ["projectId", "name"],
      unique: true,
    },
  ],
  relations: {
    appConnections: {
      type: "one-to-many",
      target: "app_connection",
      inverseSide: "appSecret",
    },
    project: {
      type: "many-to-one",
      target: "project",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "projectId",
        foreignKeyConstraintName: "fk_app_secret_project_id",
      },
    },
  },
});
