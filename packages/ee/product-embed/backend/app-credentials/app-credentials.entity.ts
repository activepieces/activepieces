import { EntitySchema } from "typeorm";
import { ApIdSchema, BaseColumnSchemaPart } from "@backend/helper/base-entity";
import { AppCredential } from "../../shared/app-credentials/app-credentials";
import { Project } from "@activepieces/shared";

export interface AppCredentialSchema extends AppCredential {
    project: Project[]
}

export const AppCredentialEntity = new EntitySchema<AppCredentialSchema>({
    name: "app_credential",
    columns: {
        ...BaseColumnSchemaPart,
        appName: {
            type: String,
        },
        projectId: ApIdSchema,
        settings: {
            type: "jsonb",
        },
    },
    indices: [
        {
            name: "idx_app_credentials_projectId_appName",
            columns: ["appName", "projectId"],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: "many-to-one",
            target: "project",
            joinColumn: true,
            inverseSide: "appCredentials",
        },
    },
});