import { Platform, PlatformAiCreditsPayment } from '@activepieces/shared'
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
            type: 'float',
            nullable: false,
        },
        aiCredits: {
            type: 'float',
            nullable: false,
        },
        txId: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
        }
    },
    indices: [],
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
