import { Chatbot, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../database/database-common'

type ChatbotSchema = Chatbot & {
    project: Project
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
        },
        dataSources: {
            type: JSONB_COLUMN_TYPE,
        },
        settings: {
            type: JSONB_COLUMN_TYPE,
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
    },
})
