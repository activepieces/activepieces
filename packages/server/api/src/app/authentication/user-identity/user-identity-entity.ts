import { UserIdentity } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../../database/database-common'

export const UserIdentityEntity = new EntitySchema<UserIdentity>({
    name: 'user_identity',
    columns: {
        ...BaseColumnSchemaPart,
        email: {
            type: String,
            nullable: false,
            unique: true,
        },
        password: {
            type: String,
        },
        trackEvents: {
            type: Boolean,
            nullable: true,
        },
        newsLetter: {
            type: Boolean,
            nullable: true,
        },
        verified: {
            type: Boolean,
            nullable: false,
            default: false,
        },
        firstName: {
            type: String,
            nullable: false,
        },
        lastName: {
            type: String,
            nullable: false,
        },
        tokenVersion: {
            type: String,
            nullable: true,
        },
        provider: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_user_identity_email',
            columns: ['email'],
            unique: true,
        },
    ],
})
