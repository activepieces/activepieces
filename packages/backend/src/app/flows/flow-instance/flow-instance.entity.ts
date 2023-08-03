import { EntitySchema } from 'typeorm'
import { Flow, FlowInstance, FlowVersion } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

export type FlowInstanceSchema = {
    flow: Flow
    flowVersion: FlowVersion
} & FlowInstance

export const FlowInstanceEntity = new EntitySchema<FlowInstanceSchema>({
    name: 'flow_instance',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        flowVersionId: ApIdSchema,
        status: {
            type: String,
        },
        schedule: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_flow_instance_project_id_flow_id',
            columns: ['projectId', 'flowId'],
            unique: true,
        },
    ],
    relations: {
        flow: {
            type: 'one-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_flow_instance_flow',
            },
        },
        flowVersion: {
            type: 'one-to-one',
            target: 'flow_version',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowVersionId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_flow_instance_flow_version',
            },
        },
    },
})
