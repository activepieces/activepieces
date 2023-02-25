import { FlowId, ProjectId } from "@activepieces/shared";
import { ApIdSchema, BaseColumnSchemaPart } from "../helper/base-entity";
import { EntitySchema } from "typeorm";

export type AppEventRoutingId = string;

export interface AppEventRouting {
    id: AppEventRoutingId;
    created: string;
    updated: string;
    appName: string;
    projectId: ProjectId;
    flowId: FlowId;
    identifierValue: string;
    event: string;
}

export const AppEventRoutingEntity = new EntitySchema<AppEventRouting>({
    name: "app_event",
    columns: {
        ...BaseColumnSchemaPart,
        appName: {
            type: String,
        },
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        identifierValue: {
            type: String
        },
        event: {
            type: String
        }
    },
    indices: [
        {
            name: "idx_app_event_flow_id",
            columns: ["flow_id"],
            unique: false,
        },
        {
            name: "idx_app_event_project_id_appName_identifier_value_event",
            columns: ["appName", "projectId", "identifierValue", "event"],
            unique: true,
        },
    ],
});