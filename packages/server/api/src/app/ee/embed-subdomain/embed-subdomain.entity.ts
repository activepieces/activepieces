import { EmbedSubdomain, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type EmbedSubdomainSchema = EmbedSubdomain & {
    platform: Platform
}

export const EmbedSubdomainEntity = new EntitySchema<EmbedSubdomainSchema>({
    name: 'embed_subdomain',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        hostname: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        cloudflareId: {
            type: String,
            nullable: false,
        },
        verificationRecords: {
            type: 'jsonb',
            nullable: false,
            default: '[]',
        },
    },
    indices: [
        {
            name: 'idx_embed_subdomain_platform_id',
            columns: ['platformId'],
            unique: true,
        },
        {
            name: 'idx_embed_subdomain_hostname',
            columns: ['hostname'],
            unique: true,
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
                foreignKeyConstraintName: 'fk_embed_subdomain_platform_id',
            },
        },
    },
})
