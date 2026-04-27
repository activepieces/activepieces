import { UserSandbox } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type UserSandboxWithRelations = UserSandbox & {
    user: unknown
}

export const UserSandboxEntity = new EntitySchema<UserSandboxWithRelations>({
    name: 'user_sandbox',
    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        sandboxId: {
            type: String,
            nullable: false,
        },
        lastUsedAt: {
            type: 'timestamp with time zone',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_user_sandbox_user_id',
            columns: ['userId'],
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
                foreignKeyConstraintName: 'fk_user_sandbox_user_id',
            },
        },
    },
})
