import { AppConnection, Project } from '@activepieces/shared';
import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../helper/base-entity';
import { EncryptedObject } from '../helper/encryption';

export type AppConnectionSchema = AppConnection & { project: Project , value: EncryptedObject};

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
            type: 'jsonb',
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
});
