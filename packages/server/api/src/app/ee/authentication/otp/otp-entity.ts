import { OtpModel, OtpState, OtpType } from '@activepieces/ee-shared'
import { UserIdentity } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type OtpSchema = OtpModel & {
    userIdentity: UserIdentity
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
        identityId: {
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
            name: 'idx_otp_identity_id_type',
            columns: ['identityId', 'type'],
            unique: true,
        },
    ],
    relations: {
        userIdentity: {
            type: 'many-to-one',
            target: 'user_identity',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'identityId',
                foreignKeyConstraintName: 'fk_otp_identity_id',
            },
        },
    },
})
