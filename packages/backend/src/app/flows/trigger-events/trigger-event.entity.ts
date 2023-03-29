import { EntitySchema } from 'typeorm';
import { Flow, Project, TriggerEvent } from '@activepieces/shared';
import { ApIdSchema, BaseColumnSchemaPart } from '../../helper/base-entity';

interface TriggerEventSchema extends TriggerEvent {
    flow: Flow;
    project: Project;
}

export const TriggerEventEntity = new EntitySchema<TriggerEventSchema>({
    name: 'trigger_event',
    columns: {
        ...BaseColumnSchemaPart,
        flowId: ApIdSchema,
        projectId: ApIdSchema,
        sourceName: {
            type: String,
        },
        payload: {
            type: 'jsonb'
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
});
