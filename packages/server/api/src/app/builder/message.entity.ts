import {
    BuilderMessage,
    BuilderMessageRole,
    Flow,
    Project,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../database/database-common'

type BuilderMessageSchema = BuilderMessage & {
    project: Project
    flow: Flow
}

export const BuilderMessageEntity = new EntitySchema<BuilderMessageSchema>({
    name: 'builder_message',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        role: {
            type: String,
            enum: BuilderMessageRole,
            nullable: false,
        },
        content: {
            type: String,
            nullable: false,
        },
        usage: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_builder_message_project_flow',
            columns: ['projectId', 'flowId'],
        },
    ],
    relations: {
        flow: {
            type: 'many-to-one',
            target: 'flow',
            inverseSide: 'builder_messages',
            onDelete: 'CASCADE',
            nullable: false,
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            inverseSide: 'builder_messages',
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})
