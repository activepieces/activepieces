import { EntitySchema } from "typeorm";
import { AppConnection, Collection, Flow, Project, User } from "@activepieces/shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";
import { ConnectionKey } from "@ee/product-embed/shared/connection-keys/connection-key";
import { AppCredential } from "@ee/product-embed/shared/app-credentials/app-credentials";

interface ProjectSchema extends Project {
  owner: User;
  collections: Collection[];
  flows: Flow[];
  connectionKeys: ConnectionKey[];
  appCredentials: AppCredential[];
  files: File[];
  appConnections: AppConnection[];
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
        appConnections: {
            type: "one-to-many",
            target: "app_connection",
            inverseSide: "project",
        },
        appCredentials: {
            type: "one-to-many",
            target: "app_credential",
            inverseSide: "project",
        },
        connectionKeys: {
            type: "one-to-many",
            target: "connection_key",
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
        files: {
            type: "one-to-many",
            target: "file",
            inverseSide: "file",
        },
        flows: {
            type: "one-to-many",
            target: "flow",
            inverseSide: "flow",
        },
        collections: {
            type: "one-to-many",
            target: "collection",
            inverseSide: "project",
        },
    },
});
