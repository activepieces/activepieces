import {EntitySchema} from "typeorm"
import {BaseColumnSchemaPart} from "./base-entity";
import {File} from "shared/dist/model/file";
import {InstanceRun} from "shared/dist/model/instance-run";

interface InstanceRunSchema extends InstanceRun {

}

export const InstanceRunEntity = new EntitySchema<InstanceRunSchema>({
    name: "instance_run",
    columns: {
        ...BaseColumnSchemaPart,
        id: {
            type: 'bytea',
        },
        instanceId: {
            type: 'bytea',
        },
        projectId: {
            type: 'bytea',
        },
        collectionId: {
            type: 'bytea',
        },
        flowVersionId: {
            type: 'bytea',
        },
        collectionVersionId: {
            type: 'bytea',
        },
        flowDisplayName: {
            type: String,
        },
        collectionDisplayName: {
            type: String,
        },
        logsFileId: {
            type: 'bytea',
        },
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
})
