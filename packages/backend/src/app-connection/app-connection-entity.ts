import { AppConnection, AppCredential } from "shared";
import { EntitySchema } from "typeorm";
import { BaseColumnSchemaPart } from "../helper/base-entity";

export interface AppConnectionSchema extends AppConnection {
  appCredential: AppCredential;
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
