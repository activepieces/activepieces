import { Platform, PlatformAiCreditsPayment, PlatformPlan } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type PlatformAiCreditsPaymentSchema = PlatformAiCreditsPayment & {
    platform: Platform
}

export const PlatformAiCreditsPaymentEntity = new EntitySchema<PlatformAiCreditsPaymentSchema>({
    name: 'platform_ai_credits_payment',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        amount: {
            type: Number,
            nullable: false,
        },
        aiCredits: {
            type: Number,
            nullable: false,
        },
        txId: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_platform_ai_credits_payment_tx_id',
            columns: ['txId'],
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
                foreignKeyConstraintName: 'fk_platform_ai_credits_payment_platform_id',
            },
        },
    },
})
