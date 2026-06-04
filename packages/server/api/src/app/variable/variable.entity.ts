import {
    User,
    UserIdentity,
    Variable,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

export type VariableSchema = Omit<Variable, 'value'> & {
    value: EncryptedObject
    owner?: (User & { identity?: UserIdentity })
}

export const VariableEntity = new EntitySchema<VariableSchema>({
    name: 'variable',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        projectId: {
            type: String,
            nullable: false,
        },
        platformId: {
            type: String,
            nullable: false,
        },
        ownerId: {
            type: String,
            nullable: true,
        },
        value: {
            type: 'jsonb',
        },
        metadata: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_variable_project_id_and_name',
            columns: ['projectId', 'name'],
            unique: true,
        },
        {
            name: 'idx_variable_owner_id',
            columns: ['ownerId'],
        },
    ],
    relations: {
        owner: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'ownerId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_variable_owner_id',
            },
        },
    },
})
