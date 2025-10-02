import { OutgoingWebhook, OutgoingWebhookScope } from '@activepieces/ee-shared'
import { Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, ARRAY_COLUMN_TYPE, BaseColumnSchemaPart, isPostgres } from '../database/database-common'

export type OutgoingWebhookSchema = OutgoingWebhook & {
    platform: Platform
    project: Project
}

export const OutgoingWebhookEntity = new EntitySchema<OutgoingWebhookSchema>({
    name: 'outgoing_webhook',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: true,
        },
        scope: {
            type: String,
            nullable: false,
        },
        events: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
        url: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_outgoing_webhook_platform_scope',
            columns: ['platformId'],
            where: `scope = '${OutgoingWebhookScope.PLATFORM}'`,
        },
        {
            name: 'idx_outgoing_webhook_project_scope',
            columns: ['projectId'],
            where: `scope = '${OutgoingWebhookScope.PROJECT}'`,
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
                foreignKeyConstraintName: 'fk_outgoing_webhook_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_outgoing_webhook_project_id',
            },
        },
    },
})
