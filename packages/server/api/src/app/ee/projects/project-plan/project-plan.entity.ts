import { Project, ProjectPlan } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
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
            type: String,
            array: true,
            nullable: false,
        },
        locked: {
            type: Boolean,
            default: false,
        },
        piecesFilterType: {
            type: String,
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
