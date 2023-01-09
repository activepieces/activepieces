import { AppConnection, AppSecret } from "shared";
import { EntitySchema } from "typeorm";
import { BaseColumnSchemaPart } from "../helper/base-entity";

export interface AppConnectionSchema extends AppConnection {
  appSecret: AppSecret;
}

export const AppConnectionEntity = new EntitySchema<AppConnectionSchema>({
  name: "app_connection",
  columns: {
    ...BaseColumnSchemaPart,
    name: {
      type: String,
    },
    appSecretId: {
      type: String
    },
    connection: {
      type: "jsonb"
    }
  },
  indices: [
    {
      name: "idx_app_connection_secret_id_name",
      columns: ["appSecretId", "name"],
      unique: true,
    },
  ],
  relations: {
    appSecret: {
      type: "many-to-one",
      target: "app_secret",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "appSecretId",
        foreignKeyConstraintName: "fk_app_connection_app_secret_id",
      },
    },
  },
});
