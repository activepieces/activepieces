import { Project, ProjectPlan } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
} from '../../../database/database-common'

export type ProjectPlanSchema = {
    project: Project
} & ProjectPlan

export const ProjectPlanEntity = new EntitySchema<ProjectPlanSchema>({
    name: 'project_plan',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        name: {
            type: String,
        },
        pieces: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
        locked: {
            type: Boolean,
            default: false,
        },
        piecesFilterType: {
            type: String,
        },
        tasks: {
            type: Number,
            nullable: true,
        },

        aiCredits: {
            type: Number,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_plan_project_id',
            columns: ['projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'one-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_project_plan_project_id',
            },
        },
    },
})
