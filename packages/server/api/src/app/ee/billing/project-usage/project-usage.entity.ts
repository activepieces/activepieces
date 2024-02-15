import { EntitySchema } from 'typeorm'
import { Project } from '@activepieces/shared'
import { ProjectUsage } from '@activepieces/ee-shared'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    TIMESTAMP_COLUMN_TYPE,
} from '../../../database/database-common'

export type ProjectUsageDatabaseEntity = Omit<
ProjectUsage,
'consumedTasksToday' | 'activeFlows' | 'connections' | 'teamMembers'
>

export type ProjectUsageSchema = {
    project: Project
} & ProjectUsageDatabaseEntity

export const ProjectUsageEntity = new EntitySchema<ProjectUsageSchema>({
    name: 'project_usage',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        nextResetDatetime: {
            type: TIMESTAMP_COLUMN_TYPE,
        },
        consumedTasks: {
            type: Number,
        },
    },
    indices: [
        {
            name: 'idx_project_usage_project_id',
            columns: ['projectId'],
            unique: false,
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
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_project_usage_project_id',
            },
        },
    },
})
