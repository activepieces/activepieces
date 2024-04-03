import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    BLOB_COLUMN_TYPE,
} from '../../database/database-common'
import { Flow, Project, StepFile } from '@activepieces/shared'

type StepFileSchema = StepFile & {
    project: Project
    flow: Flow
}

export const StepFileEntity = new EntitySchema<StepFileSchema>({
    name: 'step_file',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: ApIdSchema,
        projectId: ApIdSchema,
        name: {
            type: String,
            nullable: false,
        },
        size: {
            type: Number,
            nullable: false,
        },
        stepName: {
            type: String,
            nullable: false,
        },
        data: {
            type: BLOB_COLUMN_TYPE,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'step_file_project_id_flow_id_step_name_name',
            unique: true,
            columns: ['projectId', 'flowId', 'stepName', 'name'],
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
                foreignKeyConstraintName: 'fk_step_file_project_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_step_file_flow_id',
            },
        },
    },
})
