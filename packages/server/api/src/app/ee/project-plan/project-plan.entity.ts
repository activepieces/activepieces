import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
} from '../../database/database-common'
import { Project, ProjectPlan } from '@activepieces/shared'

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
        minimumPollingInterval: {
            type: Number,
        },
        connections: {
            type: Number,
        },
        pieces: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
        piecesFilterType: {
            type: String,
        },
        teamMembers: {
            type: Number,
        },
        tasks: {
            type: Number,
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
