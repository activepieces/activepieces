import { Flow, Project, Trigger } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../database/database-common'


export type TriggerSchema = Trigger & {
    flow: Flow
    project: Project
}

export const TriggerEntity = new EntitySchema<TriggerSchema>({
    name: 'trigger',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: {
            type: String,
            nullable: false,
        },
        flowVersionId: {
            type: String,
            nullable: false,
        },
        handshakeConfiguration: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        projectId: {
            type: String,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
        },
        schedule: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        pieceName: {
            type: String,
            nullable: false,
        },
        pieceVersion: {
            type: String,
            nullable: false,
        },
        simulate: {
            type: Boolean,
            nullable: false,
        },
    },
    indices: [
        {
            columns: ['projectId', 'flowId', 'simulate'],
            unique: true,
        },
        {
            columns: ['flowId', 'simulate'],
            unique: true,
        },
    ],
    relations: {
        flow: {
            type: 'many-to-one',
            target: 'flow',
            inverseSide: 'triggers',
            cascade: true,
            onDelete: 'CASCADE',
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            inverseSide: 'triggers',
            cascade: true,
            onDelete: 'CASCADE',
        },
    },
})
