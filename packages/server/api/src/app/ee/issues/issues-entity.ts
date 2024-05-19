import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    TIMESTAMP_COLUMN_TYPE,
} from '../../database/database-common'
import {
    Issue,
    IssueStatus,
} from '@activepieces/ee-shared'
import { Flow, Project } from '@activepieces/shared'


type IssueSchema = Issue & {
    project: Project
    flow: Flow
}

export const IssueEntity = new EntitySchema<IssueSchema>({
    name: 'issue',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
        },
        flowId: {
            ...ApIdSchema,
        },
        status: {
            type: String,
            enum: IssueStatus,
        },
        count: {
            type: Number,
        },
        lastOccurrence: {
            type: TIMESTAMP_COLUMN_TYPE,
        },
    },
    indices: [
        {
            name: 'idx_issue_flow_id',
            unique: true,
            columns: ['flowId'],
        },
        {
            name: 'idx_issue_project_id_flow_id',
            unique: false,
            columns: ['projectId', 'flowId'],
        },
    ],
    relations: {
        flow: {
            type: 'one-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_issue_flow_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onUpdate: 'RESTRICT',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_issue_project_id',
            },
        },
    },
})


