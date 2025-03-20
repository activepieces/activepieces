import { TodoComment } from '@activepieces/ee-shared'
import { Todo, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

export type TodoCommentSchema = TodoComment & {
    todo: Todo
    user: User
}

export const TodoCommentEntity = new EntitySchema<TodoCommentSchema>({
    name: 'todo_comment',
    columns: {
        ...BaseColumnSchemaPart,
        todoId: {
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
            name: 'idx_todo_comment_todo_id',
            columns: ['todoId'],
        },
        {
            name: 'idx_todo_comment_user_id',
            columns: ['userId'],
        },
    ],
    relations: {
        todo: {
            type: 'many-to-one',
            target: 'todo',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'todoId',
                foreignKeyConstraintName: 'fk_todo_comment_todo_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_todo_comment_user_id',
            },
        },
    },
})
