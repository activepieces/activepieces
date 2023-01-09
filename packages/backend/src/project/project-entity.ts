import { EntitySchema } from "typeorm";
import { AppCredential, Collection, Project, User } from "shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";

interface ProjectSchema extends Project {
  owner: User;
  collections: Collection[];
  appCredentials: AppCredential[];
}

export const ProjectEntity = new EntitySchema<ProjectSchema>({
  name: "project",
  columns: {
    ...BaseColumnSchemaPart,
    ownerId: ApIdSchema,
    displayName: {
      type: String,
    },
  },
  indices: [
    {
      name: "idx_project_owner_id",
      columns: ["ownerId"],
      unique: false,
    },
  ],
  relations: {
    appCredentials: {
      type: "one-to-many",
      target: "app_credential",
      inverseSide: "project",
    },
    owner: {
      type: "many-to-one",
      target: "user",
      joinColumn: {
        name: "ownerId",
        foreignKeyConstraintName: "fk_project_owner_id",
      },
    },
    collections: {
      type: "one-to-many",
      target: "collection",
      inverseSide: "project",
    },
  },
});
