import {
    CustomDomain,
    CustomDomainStatus,
} from '@activepieces/ee-shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { Platform } from '@activepieces/shared'

type CustomDomainSchema = CustomDomain & {
    platform?: Platform
}

export const CustomDomainEntity = new EntitySchema<CustomDomainSchema>({
    name: 'custom_domain',
    columns: {
        ...BaseColumnSchemaPart,
        domain: {
            type: String,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        status: {
            type: String,
            enum: CustomDomainStatus,
        },
    },
    indices: [
        {
            name: 'custom_domain_domain_unique',
            unique: true,
            columns: ['domain'],
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
                foreignKeyConstraintName: 'fk_custom_domain_platform_id',
            },
        },
    },
})
