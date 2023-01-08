import { EntitySchema } from "typeorm";
import { AppAuth, Project } from "shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

export interface AppAuthSchema extends AppAuth {
  project: Project;
}

export const AppAuthEntity = new EntitySchema<AppAuthSchema>({
  name: "app_auth",
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
  indices: [],
  relations: {
    project: {
      type: "many-to-one",
      target: "project",
      cascade: true,
      onDelete: "CASCADE",
      joinColumn: {
        name: "projectId",
        foreignKeyConstraintName: "fk_app_auth_project_id",
      },
    },
  },
});
