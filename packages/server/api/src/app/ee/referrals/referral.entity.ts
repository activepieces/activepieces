import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { Referral } from '@activepieces/ee-shared'
import { User } from '@activepieces/shared'

export type ReferralSchema = Referral & {
    referredUser: User
    referringUser: User
}

export const ReferralEntity = new EntitySchema<ReferralSchema>({
    name: 'referal',
    columns: {
        ...BaseColumnSchemaPart,
        referredUserId: {
            ...ApIdSchema,
            nullable: true,
        },
        referredUserEmail: {
            type: String,
            length: 500,
            nullable: false,
        },
        referringUserId: {
            ...ApIdSchema,
            nullable: true,
        },
        referringUserEmail: {
            type: String,
            length: 500,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_referral_referring_user_id',
            columns: ['referredUserId', 'referringUserId'],
            unique: true,
        },
    ],
    relations: {
        referredUser: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'referredUserId',
                foreignKeyConstraintName: 'fk_referral_referred_user_id',
            },
        },
        referringUser: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'referringUserId',
                foreignKeyConstraintName: 'fk_referral_referring_user_id',
            },
        },
    },
})
