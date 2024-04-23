import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'
import { Project, User } from '@activepieces/shared'

export type UserSchema = User & {
    projects: Project[]
}

export const UserEntity = new EntitySchema<UserSchema>({
    name: 'user',
    columns: {
        ...BaseColumnSchemaPart,
        email: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        password: {
            type: String,
        },
        verified: {
            type: Boolean,
        },
        status: {
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
        platformRole: {
            type: String,
            nullable: false,
        },
        externalId: {
            type: String,
            nullable: true,
        },
        platformId: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_user_platform_id_email',
            columns: ['platformId', 'email'],
            unique: true,
        },
        {
            name: 'idx_user_platform_id_external_id',
            columns: ['platformId', 'externalId'],
            unique: true,
        },
    ],
    relations: {
        projects: {
            type: 'one-to-many',
            target: 'user',
            inverseSide: 'owner',
        },
    },
})
