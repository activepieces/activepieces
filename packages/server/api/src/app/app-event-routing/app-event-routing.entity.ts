import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'
import { FlowId, ProjectId } from '@activepieces/shared'

export type AppEventRoutingId = string

export type AppEventRouting = {
    id: AppEventRoutingId
    created: string
    updated: string
    appName: string
    projectId: ProjectId
    flowId: FlowId
    identifierValue: string
    event: string
}

export const AppEventRoutingEntity = new EntitySchema<AppEventRouting>({
    name: 'app_event_routing',
    columns: {
        ...BaseColumnSchemaPart,
        appName: {
            type: String,
        },
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        identifierValue: {
            type: String,
        },
        event: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_app_event_routing_flow_id',
            columns: ['flowId'],
            unique: false,
        },
        {
            name: 'idx_app_event_project_id_appName_identifier_value_event',
            columns: ['appName', 'projectId', 'identifierValue', 'event'],
            unique: true,
        },
    ],
})
