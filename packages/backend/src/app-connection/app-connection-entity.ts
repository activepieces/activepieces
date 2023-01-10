import { AppConnection, AppCredential, Project } from "shared";
import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

export interface AppConnectionSchema extends AppConnection {
  appCredential: AppCredential;
  project: Project;
}

export const AppConnectionEntity = new EntitySchema<AppConnectionSchema>({
  name: "app_connection",
  columns: {
    ...BaseColumnSchemaPart,
    name: {
      type: String,
    },
    appCredentialId: {
      type: String
    },
    projectId: ApIdSchema,
    connection: {
      type: "jsonb"
    }
  },
  indices: [
    {
      name: "idx_app_connection_credential_id_name",
      columns: ["appCredentialId", "name"],
      unique: true,
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
        foreignKeyConstraintName: "fk_app_connection_app_project_id",
      },
    },
    appCredential: {
      type: "many-to-one",
      target: "app_credential",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "appCredentialId",
        foreignKeyConstraintName: "fk_app_connection_app_credential_id",
      },
    },
  },
});
