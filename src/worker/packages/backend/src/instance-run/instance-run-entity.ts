import {EntitySchema} from "typeorm"
import {ApIdSchema, BaseColumnSchemaPart} from "../helper/base-entity";
import {Collection, CollectionVersion, Instance, InstanceRun, Project} from "shared";

interface InstanceRunSchema extends InstanceRun {
    project: Project,
    collection: Collection,
    collectionVersion: CollectionVersion,
    instance: Instance,
}

export const InstanceRunEntity = new EntitySchema<InstanceRunSchema>({
    name: "instance_run",
    columns: {
        ...BaseColumnSchemaPart,
        instanceId: ApIdSchema,
        projectId: ApIdSchema,
        collectionId: ApIdSchema,
        flowVersionId: ApIdSchema,
        collectionVersionId: ApIdSchema,
        flowDisplayName: {
            type: String,
        },
        collectionDisplayName: {
            type: String,
        },
        logsFileId: ApIdSchema,
        status: {
            type: String,
        },
        startTime: {
            type: Number,
        },
        finishTime: {
            type: Number,
        },
    },
    indices: [
        {
            name: 'idx_run_project_id',
            columns: ['projectId'],
            unique: false,
        },
        {
            name: 'idx_run_instance_id',
            columns: ['instanceId'],
            unique: true,
        }
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: "fk_instance_run_project_id",
            },
        },
        collection: {
            type: 'many-to-one',
            target: 'collection',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'collectionId',
                foreignKeyConstraintName: "fk_instance_run_collection_id",
            },
        },
        collectionVersion: {
            type: 'many-to-one',
            target: 'collection_version',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'collectionVersionId',
                foreignKeyConstraintName: "fk_instance_run_collection_version_id",
            },
        },
        instance: {
            type: 'many-to-one',
            target: 'instance',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'instanceId',
                foreignKeyConstraintName: "fk_instance_run_instance_id",
            },
        },
    },
})
