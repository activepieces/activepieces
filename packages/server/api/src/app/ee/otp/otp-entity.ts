import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { OtpModel, OtpState, OtpType } from '@activepieces/ee-shared'
import { User } from '@activepieces/shared'

export type OtpSchema = OtpModel & {
    user: User
}

export const OtpEntity = new EntitySchema<OtpSchema>({
    name: 'otp',
    columns: {
        ...BaseColumnSchemaPart,
        type: {
            type: String,
            enum: OtpType,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        value: {
            type: String,
            nullable: false,
        },
        state: {
            type: String,
            enum: OtpState,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_otp_user_id_type',
            columns: ['userId', 'type'],
            unique: true,
        },
    ],
    relations: {
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_otp_user_id',
            },
        },
    },
})
