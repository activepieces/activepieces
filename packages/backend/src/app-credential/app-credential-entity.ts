import { Project, AppCredential, AppConnection } from "shared";
import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

export type AppCredentialSchema = AppCredential & {
  project: Project;
  appConnections: AppConnection[]
};


export const AppCredentialEntity = new EntitySchema<AppCredentialSchema>({
  name: "app_credential",
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
      name: "idx_app_credential_project_id_name",
      columns: ["projectId", "name"],
      unique: true,
    },
  ],
  relations: {
    appConnections: {
      type: "one-to-many",
      target: "app_connection",
      inverseSide: "appCredential",
    },
    project: {
      type: "many-to-one",
      target: "project",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "projectId",
        foreignKeyConstraintName: "fk_app_credential_project_id",
      },
    },
  },
});
