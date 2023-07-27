import { AppConnection, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

export type AppConnectionSchema = Omit<AppConnection, 'value' | 'status'> & { project: Project, value: EncryptedObject }

export const AppConnectionEntity = new EntitySchema<AppConnectionSchema>({
    name: 'app_connection',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        appName: {
            type: String,
        },
        projectId: ApIdSchema,
        value: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    indices: [
        {
            name: 'idx_app_connection_project_id_and_name',
            columns: ['projectId', 'name'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_app_connection_app_project_id',
            },
        },
    },
})
