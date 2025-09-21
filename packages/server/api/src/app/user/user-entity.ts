import { Project, User, UserIdentity } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, TIMESTAMP_COLUMN_TYPE } from '../database/database-common'

export type UserSchema = User & {
    projects: Project[]
    identity: UserIdentity
}

export const UserEntity = new EntitySchema<UserSchema>({
    name: 'user',
    columns: {
        ...BaseColumnSchemaPart,
        status: {
            type: String,
        },
        lastChangelogDismissed: {
            type: TIMESTAMP_COLUMN_TYPE,
            nullable: true,
        },
        platformRole: {
            type: String,
            nullable: false,
        },
        identityId: {
            type: String,
            nullable: false,
        },
        externalId: {
            type: String,
            nullable: true,
        },
        externalIss: {
            type: String,
            nullable: true,
        },
        externalSub: {
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
            columns: ['platformId', 'identityId'],
            unique: true,
        },
        {
            name: 'idx_user_platform_id_external_id',
            columns: ['platformId', 'externalId'],
            unique: true,
        },
        {
            name: 'idx_user_external_iss_sub',
            columns: ['externalIss', 'externalSub'],
            unique: true,
        },
    ],
    relations: {
        projects: {
            type: 'one-to-many',
            target: 'project',
            inverseSide: 'owner',
        },
        identity: {
            type: 'many-to-one',
            target: 'user_identity',
            joinColumn: {
                name: 'identityId',
                referencedColumnName: 'id',
            },
        },
    },
})
