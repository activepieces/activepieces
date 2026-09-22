import { DestinationType, EventDestination, EventDestinationScope, Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { z } from 'zod'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

type WithoutHeaders<T> = T extends unknown ? Omit<T, 'headers'> : never

export const StoredEventDestinationHeaders = z.record(z.string(), EncryptedObject)

export type StoredEventDestinationHeaders = z.infer<typeof StoredEventDestinationHeaders>

export type EventDestinationRow = WithoutHeaders<EventDestination> & {
    headers: StoredEventDestinationHeaders | null
}

export type EventDestinationSchema = EventDestinationRow & {
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
        name: {
            type: String,
            nullable: true,
        },
        type: {
            type: String,
            nullable: false,
            default: DestinationType.CUSTOM,
        },
        enabled: {
            type: Boolean,
            nullable: false,
            default: true,
        },
        headers: {
            type: 'jsonb',
            nullable: true,
        },
        mapper: {
            type: 'jsonb',
            nullable: true,
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

