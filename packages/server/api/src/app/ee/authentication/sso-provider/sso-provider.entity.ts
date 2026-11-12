import { Platform, SsoProvider, SsoProviderStatus } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export type SsoProviderSchema = SsoProvider & {
    platform: Platform
}

export const SsoProviderEntity = new EntitySchema<SsoProviderSchema>({
    name: 'sso_provider',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        protocol: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        config: {
            type: 'jsonb',
            nullable: false,
            select: false,
        },
    },
    indices: [
        {
            name: 'idx_sso_provider_platform_id',
            columns: ['platformId'],
        },
        {
            name: 'idx_sso_provider_platform_id_not_draft',
            columns: ['platformId'],
            unique: true,
            where: `"status" <> '${SsoProviderStatus.DRAFT}'`,
        },
        {
            name: 'idx_sso_provider_platform_id_draft',
            columns: ['platformId'],
            unique: true,
            where: `"status" = '${SsoProviderStatus.DRAFT}'`,
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
                foreignKeyConstraintName: 'fk_sso_provider_platform_id',
            },
        },
    },
})
