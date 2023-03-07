import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "@backend/helper/base-entity";
import { ConnectionKey } from "../../shared/connection-keys/connection-key";
import { Project } from "@activepieces/shared";

export interface ConnectionKeySchema extends ConnectionKey {
    project: Project;
}

export const ConnectionKeyEntity = new EntitySchema<ConnectionKeySchema>({
    name: "connection_key",
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        settings: {
            type: "jsonb",
        },
    },
    indices: [
        {
            name: "idx_connection_key_project_id",
            columns: ["projectId"],
            unique: false,
        },
    ],
    relations: {
        project: {
            type: "many-to-one",
            target: "project",
            joinColumn: true,
            inverseSide: "connectionKeys",
        },
    },
});