import { UserIdentity } from '@activepieces/shared'
import { EntitySchema, EntitySchemaColumnOptions } from 'typeorm'

export const UserIdentityEntity = new EntitySchema<UserIdentity>({
    name: 'user_identity',
    columns: {
        id: {
            type: String,
            primary: true,
        } as EntitySchemaColumnOptions,
        createdAt: {
            type: 'timestamp with time zone',
            createDate: true,
        } as EntitySchemaColumnOptions,
        updatedAt: {
            type: 'timestamp with time zone',
            updateDate: true,
        } as EntitySchemaColumnOptions,
        email: {
            type: String,
            nullable: false,
            unique: true,
        },
        trackEvents: {
            type: Boolean,
            nullable: true,
        },
        newsLetter: {
            type: Boolean,
            nullable: true,
        },

        emailVerified: {
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
        password: {
            type: String,
            nullable: true,
        },
        tokenVersion: {
            type: String,
            nullable: true,
        },
        provider: {
            type: String,
            nullable: false,
        },
        imageUrl: {
            type: String,
            nullable: true,
        },
        twoFactorEnabled: {
            type: Boolean,
            nullable: false,
            default: false,
        },

        /** @deprecated use emailVerified instead */
        verified: {
            type: Boolean,
            nullable: false,
            default: false,
        },

        // unused but required by better-auth
        name: {
            type: String,
            nullable: false,
            default: '',
        },
        image: {
            type: String,
            nullable: true,
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
