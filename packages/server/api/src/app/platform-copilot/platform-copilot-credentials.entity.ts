import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

export type PlatformCopilotCredentialsSchema = {
    id: string
    created: string
    updated: string
    platformId: string
    copilotApiKey: EncryptedObject
}

export const PlatformCopilotCredentialsEntity = new EntitySchema<PlatformCopilotCredentialsSchema>({
    name: 'platform_copilot_credentials',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
            nullable: false,
        },
        copilotApiKey: {
            type: 'jsonb',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_platform_copilot_credentials_platform_id',
            columns: ['platformId'],
            unique: true,
        },
    ],
})
