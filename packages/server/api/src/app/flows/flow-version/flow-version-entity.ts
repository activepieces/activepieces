import { Flow, FlowVersion, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'

type FlowVersionSchema = {
    flow: Flow
    updatedByUser: User
} & FlowVersion

export const FlowVersionEntity = new EntitySchema<FlowVersionSchema>({
    name: 'flow_version',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: ApIdSchema,
        displayName: {
            type: String,
        },
        schemaVersion: {
            type: String,
            nullable: true,
        },
        trigger: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        connectionIds: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
        updatedBy: {
            type: String,
            nullable: true,
        },
        valid: {
            type: Boolean,
        },
        state: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_flow_version_flow_id',
            columns: ['flowId'],
            unique: false,
        },
    ],
    relations: {
        updatedByUser: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'updatedBy',
                foreignKeyConstraintName: 'fk_updated_by_user_flow',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_flow_version_flow',
            },
        },
    },
})
