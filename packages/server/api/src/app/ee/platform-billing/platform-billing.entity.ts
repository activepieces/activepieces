import { PlatformBilling } from '@activepieces/ee-shared'
import { Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

export type PlatformBillingSchema = PlatformBilling & {
    platform: Platform
}

export const PlatformBillingEntity = new EntitySchema<PlatformBillingSchema>({
    name: 'platform_billing',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        includedTasks: {
            type: Number,
        },
        tasksLimit: {
            type: Number,
            nullable: true,
        },
        includedAiCredits: {
            type: Number,
        },
        aiCreditsLimit: {
            type: Number,
            nullable: true,
        },
        stripeCustomerId: {
            type: String,
            nullable: true,
        },
        stripeSubscriptionId: {
            type: String,
            nullable: true,
        },
        stripeSubscriptionStatus: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_platform_billing_platform_id',
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
                foreignKeyConstraintName: 'fk_platform_billing_platform_id',
            },
        },
    },
})
