import {
    Flow,
    FlowVersion,
    Issue,
    Project,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    TIMESTAMP_COLUMN_TYPE,
} from '../../database/database-common'


type IssueSchema = Issue & {
    project: Project
    flowVersion: FlowVersion
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
        },
        lastOccurrence: {
            type: TIMESTAMP_COLUMN_TYPE,
        },
        flowVersionId: {
            ...ApIdSchema,
        },
        stepName: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_issue_flowId_stepName',
            columns: ['flowId', 'stepName'],
            unique: true,
        },
        {
            name: 'idx_issue_projectId_status_updated',
            columns: ['projectId', 'status', 'updated'],
        },
    ],
    relations: {
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_issue_flow_id',
            },
        },
        flowVersion: {
            type: 'many-to-one',
            target: 'flow_version',
            cascade: true,
            onDelete: 'CASCADE',
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


