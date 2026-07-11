import { Platform, ReferralPhrase, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type ReferralPhraseWithRelations = ReferralPhrase & {
    platform: Platform
    user: User
}

export const ReferralPhraseEntity = new EntitySchema<ReferralPhraseWithRelations>({
    name: 'referral_phrase',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        displayPhrase: {
            type: 'text',
            nullable: false,
        },
        normalizedPhrase: {
            type: 'text',
            nullable: false,
        },
        phraseHash: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        celebrationEmojis: {
            type: 'jsonb',
            nullable: true,
        },
        celebrationScene: {
            type: 'jsonb',
            nullable: true,
        },
        celebrationImageFileId: {
            type: String,
            nullable: true,
        },
        celebrationScenePrompt: {
            type: 'text',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_referral_phrase_user_id',
            columns: ['userId'],
            unique: true,
        },
        {
            name: 'idx_referral_phrase_normalized',
            columns: ['normalizedPhrase'],
            unique: true,
        },
        {
            name: 'idx_referral_phrase_hash',
            columns: ['phraseHash'],
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
                foreignKeyConstraintName: 'fk_referral_phrase_platform_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_referral_phrase_user_id',
            },
        },
    },
})
