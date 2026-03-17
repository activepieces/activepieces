import { User, UserBadge } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type UserBadgeSchema = UserBadge & {
    user: User
}

export const UserBadgeEntity = new EntitySchema<UserBadgeSchema>({
    name: 'user_badge',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_user_badge_user_id',
            columns: ['userId'],
        },
    ],
    uniques: [
        {
            name: 'idx_user_badge_user_id_name',
            columns: ['userId', 'name'],
        },
    ],
    relations: {
        user: {
            type: 'many-to-one',
            target: 'user',
            joinColumn: {
                name: 'userId',
                referencedColumnName: 'id',
            },
            onDelete: 'CASCADE',
        },
    },
})
