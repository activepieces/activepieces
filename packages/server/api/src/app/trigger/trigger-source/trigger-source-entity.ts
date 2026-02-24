import { Flow, Project, TriggerSource } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../../database/database-common'

export type TriggerSourceSchema = TriggerSource & {
    flow: Flow
    project: Project
}

export const TriggerSourceEntity = new EntitySchema<TriggerSourceSchema>({
    name: 'trigger_source',
    columns: {
        ...BaseColumnSchemaPart,
        deleted: {
            type: 'timestamp with time zone',
            deleteDate: true,
            nullable: true,
        },
        flowId: {
            type: String,
            nullable: false,
        },
        flowVersionId: {
            type: String,
            nullable: false,
        },
        triggerName: {
            type: String,
            nullable: false,
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
            type: 'jsonb',
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
            name: 'idx_trigger_project_id_flow_id_simulate',
            where: 'deleted IS NULL',
            unique: true,
        },
        {
            columns: ['flowId', 'simulate'],
            name: 'idx_trigger_flow_id_simulate',
            where: 'deleted IS NULL',
            unique: true,
        },
        {
            columns: ['flowId'],
            name: 'idx_trigger_flow_id',
            unique: false,
        },
        {
            columns: ['projectId'],
            name: 'idx_trigger_project_id',
            unique: false,
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
