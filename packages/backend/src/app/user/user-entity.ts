import { EntitySchema } from 'typeorm'
import { Project, User } from '@activepieces/shared'
import { BaseColumnSchemaPart } from '../database/database-common'

export type UserSchema = {
    projects: Project[]
} & User

export const UserEntity = new EntitySchema<UserSchema>({
    name: 'user',
    columns: {
        ...BaseColumnSchemaPart,
        email: {
            type: String,
            unique: true,
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
        imageUrl: {
            type: String,
            nullable: true,
        },
        title: {
            type: String,
            nullable: true,
        },
    },
    relations: {
        projects: {
            type: 'one-to-many',
            target: 'user',
            inverseSide: 'owner',
        },
    },
})
