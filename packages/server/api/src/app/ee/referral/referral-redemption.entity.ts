import { ReferralPhrase, ReferralRedemption } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type ReferralRedemptionWithRelations = ReferralRedemption & {
    referralPhrase: ReferralPhrase
}

export const ReferralRedemptionEntity = new EntitySchema<ReferralRedemptionWithRelations>({
    name: 'referral_redemption',
    columns: {
        ...BaseColumnSchemaPart,
        referralPhraseId: {
            ...ApIdSchema,
            nullable: false,
        },
        inviterPlatformId: {
            ...ApIdSchema,
            nullable: false,
        },
        redeemerPlatformId: {
            ...ApIdSchema,
            nullable: false,
        },
        redeemerUserId: {
            ...ApIdSchema,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        inviterGrantUsd: {
            type: Number,
            nullable: false,
        },
        redeemerGrantUsd: {
            type: Number,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_referral_redemption_redeemer_platform',
            columns: ['redeemerPlatformId'],
            unique: true,
        },
        {
            name: 'idx_referral_redemption_inviter_platform',
            columns: ['inviterPlatformId'],
        },
        {
            name: 'idx_referral_redemption_phrase_id',
            columns: ['referralPhraseId'],
        },
    ],
    relations: {
        referralPhrase: {
            type: 'many-to-one',
            target: 'referral_phrase',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'referralPhraseId',
                foreignKeyConstraintName: 'fk_referral_redemption_phrase_id',
            },
        },
    },
})
