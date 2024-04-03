import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'
import { ConnectionKey } from '@activepieces/ee-shared'
import { Project } from '@activepieces/shared'

export type ConnectionKeySchema = {
    project: Project
} & ConnectionKey

export const ConnectionKeyEntity = new EntitySchema<ConnectionKeySchema>({
    name: 'connection_key',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        settings: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    indices: [
        {
            name: 'idx_connection_key_project_id',
            columns: ['projectId'],
            unique: false,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            onDelete: 'CASCADE',
            joinColumn: true,
            inverseSide: 'connectionKeys',
        },
    },
})
