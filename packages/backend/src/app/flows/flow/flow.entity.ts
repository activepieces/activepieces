import { EntitySchema } from 'typeorm'
import { Collection, Flow, FlowRun, FlowVersion, Project, TriggerEvent } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart } from '../../helper/base-entity'

type FlowSchema = {
    versions: FlowVersion[]
    collection: Collection
    project: Project
    runs: FlowRun[]
    events: TriggerEvent[]
} & Flow

export const FlowEntity = new EntitySchema<FlowSchema>({
    name: 'flow',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {...ApIdSchema, nullable: true},
        collectionId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_flow_collection_id',
            columns: ['collectionId'],
            unique: false,
        },
    ],
    relations: {
        runs: {
            type: 'one-to-many',
            target: 'flow_run',
            inverseSide: 'flow',
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
        collection: {
            type: 'many-to-one',
            target: 'collection',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'collectionId',
                foreignKeyConstraintName: 'fk_flow_collection_id',
            },
        },
    },
})
