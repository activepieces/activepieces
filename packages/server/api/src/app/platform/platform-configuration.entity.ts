import { Platform, PlatformConfiguration } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../database/database-common'

export type PlatformConfigurationSchema = PlatformConfiguration & {
    platform: Platform
}

export const PlatformConfigurationEntity = new EntitySchema<PlatformConfigurationSchema>({
    name: 'platform_configuration',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        isProductTelemetryEnabled: {
            type: Boolean,
            nullable: false,
            default: true,
        },
        isInfraSetupTelemetryEnabled: {
            type: Boolean,
            nullable: false,
            default: true,
        },
    },
    indices: [
        {
            name: 'idx_platform_configuration_platform_id',
            columns: ['platformId'],
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
                foreignKeyConstraintName: 'fk_platform_configuration_platform_id',
            },
        },
    },
})
