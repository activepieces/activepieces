import { ApplicationEvent } from '@activepieces/ee-shared'
import { Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type AuditEventSchema = ApplicationEvent & {
    platform: Platform
}

export const AuditEventEntity = new EntitySchema<AuditEventSchema>({
    name: 'audit_event',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
        },
        projectId: {
            type: String,
            nullable: true,
        },
        action: {
            type: String,
        },
        userEmail: {
            type: String,
            nullable: true,
        },
        projectDisplayName: {
            type: String,
            nullable: true,
        },
        data: {
            type: JSONB_COLUMN_TYPE,
        },
        ip: {
            type: String,
            nullable: true,
        },
        userId: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'audit_event_platform_id_project_id_user_id_action_idx',
            columns: ['platformId', 'projectId', 'userId', 'action'],
        },
        {
            name: 'audit_event_platform_id_user_id_action_idx',
            columns: ['platformId', 'userId', 'action'],
        },
        {
            name: 'audit_event_platform_id_action_idx',
            columns: ['platformId', 'action'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
            },
        },
    },
})
