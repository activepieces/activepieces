import { CustomDomain, CustomDomainStatus } from '@activepieces/ee-shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../../database/database-common'

export const CustomDomainEntity = new EntitySchema<CustomDomain>({
    name: 'custom_domain',
    columns: {
        ...BaseColumnSchemaPart,
        domain: {
            type: String,
        },
        status: {
            type: String,
            enum: CustomDomainStatus
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
    },
})