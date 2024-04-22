import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { Flow, Folder as Folder, Project } from '@activepieces/shared'

export type FolderSchema = {
    flows: Flow[]
    project: Project
} & Folder

export const FolderEntity = new EntitySchema<FolderSchema>({
    name: 'folder',
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String,
        },
        projectId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_folder_project_id_display_name',
            columns: ['projectId', 'displayName'],
            unique: true,
        },
    ],
    relations: {
        flows: {
            type: 'one-to-many',
            target: 'flow',
            inverseSide: 'folder',
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_folder_project',
            },
        },
    },
})
