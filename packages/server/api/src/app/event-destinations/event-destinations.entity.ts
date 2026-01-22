import { EventDestination, EventDestinationScope } from '@activepieces/ee-shared'
import { Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

export type EventDestinationSchema = EventDestination & {
    platform: Platform
    project: Project
}

export const EventDestinationEntity = new EntitySchema<EventDestinationSchema>({
    name: 'event_destination',
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
            type: String,
            array: true,
            nullable: false,
        },
        url: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_event_destination_platform_scope',
            columns: ['platformId'],
            where: `scope = '${EventDestinationScope.PLATFORM}'`,
        },
        {
            name: 'idx_event_destination_project_scope',
            columns: ['projectId'],
            where: `scope = '${EventDestinationScope.PROJECT}'`,
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
                foreignKeyConstraintName: 'fk_event_destination_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_event_destination_project_id',
            },
        },
    },
})

