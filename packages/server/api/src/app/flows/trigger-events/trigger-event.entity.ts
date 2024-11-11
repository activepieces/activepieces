import { File, Flow, Project, TriggerEvent } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

type TriggerEventSchema = {
    flow: Flow
    project: Project
    file: File
} & TriggerEvent

export const TriggerEventEntity = new EntitySchema<TriggerEventSchema>({
    name: 'trigger_event',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: ApIdSchema,
        projectId: ApIdSchema,
        sourceName: {
            type: String,
        },
        fileId: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_trigger_event_flow_id',
            columns: ['flowId'],
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
                foreignKeyConstraintName: 'fk_trigger_event_project_id',
            },
        },
        file: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'fileId',
                foreignKeyConstraintName: 'fk_trigger_event_file_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_trigger_event_flow_id',
            },
        },
    },
})
