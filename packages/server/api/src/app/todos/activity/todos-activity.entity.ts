import { Todo, TodoActivity, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'

export type TodoActivitySchema = TodoActivity & {
    todo: Todo
    user: User
}

export const TodoActivityEntity = new EntitySchema<TodoActivitySchema>({
    name: 'todo_activity',
    columns: {
        ...BaseColumnSchemaPart,
        todoId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: true,
        },
        content: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_todo_activity_todo_id',
            columns: ['todoId'],
        },
        {
            name: 'idx_todo_activity_user_id',
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
                foreignKeyConstraintName: 'fk_todo_activity_todo_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_todo_activity_user_id',
            },
        },
    },
})
