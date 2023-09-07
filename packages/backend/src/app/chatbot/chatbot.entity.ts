import { AppConnection, Chatbot, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../database/database-common'

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
        dataSources: {
            type: JSONB_COLUMN_TYPE,
        },
        prompt: {
            type: String,
            nullable: true,
        }
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
        }
    },
})
