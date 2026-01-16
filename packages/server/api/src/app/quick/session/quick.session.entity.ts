import { EntitySchema } from 'typeorm';
import { QuickSession} from '@activepieces/shared';
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common';

export const QuickSessionEntity = new EntitySchema<QuickSession>({
    name: 'quick_session',
    tableName: 'quick_session',

    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        plan: {
            type: 'jsonb',
            nullable: false,
        },
        conversation: {
            type: 'jsonb',
            nullable: false,
        },
    },

    indices: [],

    relations: {
        userId: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'userId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_quick_session_user',
            },
        },
    },
});
