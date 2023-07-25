import { EntitySchema } from 'typeorm'
import { Flow, Folder, FlowRun, FlowVersion, Project, TriggerEvent } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type FlowSchema = {
    versions: FlowVersion[]
    project: Project
    runs: FlowRun[]
    folder?: Folder
    events: TriggerEvent[]
} & Flow

export const FlowEntity = new EntitySchema<FlowSchema>({
    name: 'flow',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: { ...ApIdSchema },
        folderId: { ...ApIdSchema, nullable: true },
    },
    indices: [
        {
            name: 'idx_flow_project_id',
            columns: ['projectId'],
            unique: false,
        },
        {
            name: 'idx_flow_folder_id',
            columns: ['folderId'],
            unique: false,
        },
    ],
    relations: {
        runs: {
            type: 'one-to-many',
            target: 'flow_run',
            inverseSide: 'flow',
        },
        folder: {
            type: 'many-to-one',
            target: 'folder',
            onDelete: 'SET NULL',
            nullable: true,
            joinColumn: {
                name: 'folderId',
                foreignKeyConstraintName: 'fk_flow_folder_id',
            },
        },
        events: {
            type: 'one-to-many',
            target: 'trigger_event',
            inverseSide: 'flow',
        },
        versions: {
            type: 'one-to-many',
            target: 'flow_version',
            inverseSide: 'flow',
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_flow_project_id',
            },
        },
    },
})
