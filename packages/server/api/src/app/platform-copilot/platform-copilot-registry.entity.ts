import { ApEdition } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type PlatformCopilotRegistrySchema = {
    id: string
    created: string
    updated: string
    platformId: string
    copilotApiKeyHash: string
    edition: ApEdition
    version: string
    blockedAt: string | null
    lastSeenAt: string
}

export const PlatformCopilotRegistryEntity = new EntitySchema<PlatformCopilotRegistrySchema>({
    name: 'platform_copilot_registry',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
            nullable: false,
        },
        copilotApiKeyHash: {
            type: String,
            nullable: false,
        },
        edition: {
            type: String,
            nullable: false,
        },
        version: {
            type: String,
            nullable: false,
        },
        blockedAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        lastSeenAt: {
            type: 'timestamp with time zone',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_platform_copilot_registry_platform_id',
            columns: ['platformId'],
            unique: true,
        },
        {
            name: 'idx_platform_copilot_registry_api_key_hash',
            columns: ['copilotApiKeyHash'],
            unique: true,
        },
    ],
})
