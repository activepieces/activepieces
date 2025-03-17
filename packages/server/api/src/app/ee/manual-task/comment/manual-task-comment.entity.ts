import { ManualTask, ManualTaskComment } from '@activepieces/ee-shared'
import { User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type ManualTaskCommentSchema = ManualTaskComment & {
    task: ManualTask
    user: User
}

export const ManualTaskCommentEntity = new EntitySchema<ManualTaskCommentSchema>({
    name: 'manual_task_comment',
    columns: {
        ...BaseColumnSchemaPart,
        taskId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        content: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_manual_task_comment_task_id',
            columns: ['taskId'],
        },
        {
            name: 'idx_manual_task_comment_user_id',
            columns: ['userId'],
        },
    ],
    relations: {
        task: {
            type: 'many-to-one',
            target: 'manual_task',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'taskId',
                foreignKeyConstraintName: 'fk_manual_task_comment_task_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_manual_task_comment_user_id',
            },
        },
    },
})

