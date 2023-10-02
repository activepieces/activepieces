import { AppConnection, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../database/database-common'
import { Chatbot } from '@activepieces/shared'

type ChatbotSchema = Chatbot & {
    project: Project
    connection: AppConnection
}

export const ChatbotEntity = new EntitySchema<ChatbotSchema>({
    name: 'chatbot',
    columns: {
        ...BaseColumnSchemaPart,
        type: {
            type: String,
        },
        displayName: {
            type: String,
        },
        projectId: {
            type: String,
        },
        connectionId: {
            type: String,
            nullable: true,
        },
        visibilityStatus: {
            type: String,
        },
        dataSources: {
            type: JSONB_COLUMN_TYPE,
        },
        prompt: {
            type: String,
            nullable: true,
        },
    },
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            joinColumn: {
                name: 'projectId',
            },
        },
        connection: {
            type: 'many-to-one',
            target: 'app_connection',
            joinColumn: {
                name: 'connectionId',
            },
        },
    },
})
